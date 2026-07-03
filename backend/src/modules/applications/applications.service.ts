import {
  Injectable, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QUEUE_NAMES, APPLICATION_JOBS, ANALYTICS_JOBS } from '../queues/queues.constants';
import { EmailService } from '../email/email.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly emailService: EmailService,
    @InjectQueue(QUEUE_NAMES.APPLICATION)
    private readonly applicationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ANALYTICS)
    private readonly analyticsQueue: Queue,
  ) { }

  async submit(userId: string, dto: CreateApplicationDto) {
    const job = await this.prisma.job.findFirst({
      where: { id: dto.jobId, status: 'PUBLISHED' },
      include: { company: true },
    });
    if (!job) {
      throw new NotFoundException(`Job ${dto.jobId} not found or no longer accepting applications`);
    }

    const existing = await this.prisma.application.findUnique({
      where: { jobId_userId: { jobId: dto.jobId, userId } },
    });
    if (existing) {
      throw new ConflictException('You have already applied to this job');
    }

    // Atomic create + event log
    const application = await this.prisma.$transaction(async (tx: any) => {
      const app = await tx.application.create({
        data: {
          jobId: dto.jobId,
          userId,
          coverLetter: dto.coverLetter,
          resumeUrl: dto.resumeUrl,
          status: 'SUBMITTED',
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          job: { select: { id: true, title: true, companyId: true } },
        },
      });

      await tx.eventLog.create({
        data: {
          eventType: 'application.submitted',
          entityId: app.id,
          entityType: 'Application',
          payload: {
            applicationId: app.id,
            jobId: dto.jobId,
            userId,
            jobTitle: job.title,
            companyId: job.companyId,
          },
          processedBy: ApplicationsService.name,
        },
      });

      return app;
    });

    // Fire-and-forget: do not await Redis queues so the UI doesn't hang if Redis is down locally.
    this.applicationQueue.add(
      APPLICATION_JOBS.SCREEN_CANDIDATE,
      {
        applicationId: application.id,
        userId,
        jobId: dto.jobId,
        jobTitle: job.title,
        jobDescription: job.description,
        jobRequirements: job.requirements,
        coverLetter: dto.coverLetter,
        resumeUrl: dto.resumeUrl,
        companyId: job.companyId,
      },
      { priority: 1 },
    ).catch(err => this.logger.error('Failed to enqueue SCREEN_CANDIDATE', err.message));

    this.applicationQueue.add(
      APPLICATION_JOBS.NOTIFY_RECRUITER,
      {
        applicationId: application.id,
        jobId: dto.jobId,
        jobTitle: job.title,
        companyId: job.companyId,
        applicantName: `${application.user.firstName} ${application.user.lastName}`,
      },
      { priority: 2 },
    ).catch(err => this.logger.error('Failed to enqueue NOTIFY_RECRUITER', err.message));

    this.analyticsQueue.add(
      ANALYTICS_JOBS.UPDATE_JOB_STATS,
      { jobId: dto.jobId }
    ).catch(err => this.logger.error('Failed to enqueue UPDATE_JOB_STATS', err.message));

    this.eventEmitter.emit('application.submitted', {
      applicationId: application.id,
      jobId: dto.jobId,
      userId,
    });

    // Send confirmation email to the candidate (fire-and-forget)
    this.emailService.sendApplicationSubmittedEmail({
      to: application.user.email,
      firstName: application.user.firstName,
      jobTitle: job.title,
      companyName: job.company.name,
      applicationId: application.id,
    }).catch((err) =>
      this.logger.error(`Failed to send application confirmation email to ${application.user.email}: ${err.message}`)
    );

    this.logger.log(`Application ${application.id} submitted — screening queued`);
    return application;
  }

  async findByUser(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: { job: { include: { company: true } }, score: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByJob(jobId: string, employerId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, company: { userId: employerId } },
    });
    if (!job) throw new NotFoundException('Job not found');

    return this.prisma.application.findMany({
      where: { jobId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        score: true,
      },
      orderBy: [{ score: { overallScore: 'desc' } }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { user: true, job: { include: { company: true } }, score: true },
    });
    if (!application) throw new NotFoundException(`Application ${id} not found`);
    return application;
  }

  async updateStatus(id: string, status: string, employerId: string) {
    // 1. Fetch full application with candidate + job + company so we can send emails
    const application = await this.prisma.application.findFirst({
      where: { id, job: { company: { userId: employerId } } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        job: { include: { company: true } },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application ${id} not found or you don't have permission to update it`);
    }

    // 2. Update the status
    const updated = await this.prisma.application.update({
      where: { id },
      data: { status: status as never },
    });

    // 3. Send in-app notification to the candidate
    const statusMessages: Record<string, { title: string; body: string }> = {
      SHORTLISTED:         { title: `🎉 You've been shortlisted for ${application.job.title}`, body: 'Congratulations! The employer has reviewed your application and shortlisted you.' },
      INTERVIEW_SCHEDULED: { title: `📅 Interview scheduled for ${application.job.title}`, body: 'An interview has been arranged. Check your dashboard for details.' },
      OFFERED:             { title: `🎊 Job offer received for ${application.job.title}`, body: `${application.job.company.name} has extended a job offer. Review it in your dashboard.` },
      REJECTED:            { title: `Application update for ${application.job.title}`, body: 'Thank you for your interest. Unfortunately your application was not successful this time.' },
      WITHDRAWN:           { title: `Application withdrawn for ${application.job.title}`, body: 'Your application has been marked as withdrawn.' },
    };

    const msg = statusMessages[status];
    if (msg) {
      // In-app notification via Prisma directly (no queue dependency)
      this.prisma.notification.create({
        data: {
          userId: application.userId,
          type: `application.${status.toLowerCase()}`,
          title: msg.title,
          body: msg.body,
          channel: 'IN_APP',
          metadata: { applicationId: id, jobId: application.jobId, status },
        },
      }).catch((err) =>
        this.logger.error(`Failed to create in-app notification for ${application.userId}: ${err.message}`)
      );

      // Email notification
      this.emailService.sendApplicationStatusChangedEmail({
        to:          application.user.email,
        firstName:   application.user.firstName,
        jobTitle:    application.job.title,
        companyName: application.job.company.name,
        status,
        applicationId: id,
      }).catch((err) =>
        this.logger.error(`Failed to send status email to ${application.user.email}: ${err.message}`)
      );
    }

    this.logger.log(`Application ${id} status updated to ${status} by employer ${employerId}`);
    return updated;
  }
}
