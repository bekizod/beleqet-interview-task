import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { IsNumber, IsInt, IsString, IsOptional, MinLength, Min, IsDateString } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateFreelanceJobDto } from './dto/create-freelance-job.dto';

export class CreateBidDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsInt()
  @Min(1)
  timelineDays: number;

  @IsString()
  @MinLength(10)
  coverLetter: string;
}

export class CreateMilestoneDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsDateString()
  deadline: string;
}

export class SubmitMilestoneDto {
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

@Injectable()
export class FreelanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) { }

  async getCategories() {
    return this.prisma.freelanceCategory.findMany({
      orderBy: { label: 'asc' }
    });
  }

  async createJob(clientId: string, dto: CreateFreelanceJobDto) {
    // Handle categoryId - if not provided, create or use a default category
    let categoryId = dto.categoryId;
    if (!categoryId) {
      // Try to find or create a default category
      const defaultCategory = await this.prisma.freelanceCategory.findFirst({
        where: { slug: 'general' }
      });

      if (defaultCategory) {
        categoryId = defaultCategory.id;
      } else {
        // Create a default general category
        const newCategory = await this.prisma.freelanceCategory.create({
          data: {
            slug: 'general',
            label: 'General',
          }
        });
        categoryId = newCategory.id;
      }
    }

    return this.prisma.freelanceJob.create({
      data: {
        ...dto,
        categoryId,
        clientId,
        status: 'OPEN'
      },
      include: { category: true, client: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async updateJobStatus(jobId: string, clientId: string, status: 'COMPLETED' | 'CANCELLED') {
    const job = await this.prisma.freelanceJob.findFirst({
      where: { id: jobId, clientId },
    });

    if (!job) {
      throw new NotFoundException('Job not found or you are not the owner');
    }

    return this.prisma.freelanceJob.update({
      where: { id: jobId },
      data: { status },
    });
  }

  async findJobs(query: { q?: string; category?: string; page?: number; limit?: number }) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 20;
    const { q, category } = query;

    const where: Record<string, unknown> = { status: { in: ['OPEN', 'FUNDED'] } };
    if (category) where['category'] = { slug: category };
    if (q) where['OR'] = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];

    const [items, total] = await Promise.all([
      this.prisma.freelanceJob.findMany({
        where: where as never,
        include: { category: true, _count: { select: { bids: true } } },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prisma.freelanceJob.count({ where: where as never }),
    ]);

    return { items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async findJobById(id: string) {
    const job = await this.prisma.freelanceJob.findUnique({
      where: { id },
      include: {
        category: true,
        client: { select: { id: true, firstName: true, lastName: true } },
        bids: {
          include: { freelancer: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!job) throw new NotFoundException('Gig not found');
    return job;
  }

  async submitBid(freelancerId: string, gigId: string, dto: CreateBidDto) {
    const gig = await this.prisma.freelanceJob.findFirst({
      where: { id: gigId, status: { in: ['OPEN', 'FUNDED'] } },
    });
    if (!gig) throw new NotFoundException('Gig not found or no longer accepting bids');

    const existing = await this.prisma.bid.findUnique({
      where: { freelanceJobId_freelancerId: { freelanceJobId: gigId, freelancerId } },
    });
    if (existing) throw new ConflictException('You have already submitted a bid');

    const bid = await this.prisma.bid.create({ data: { ...dto, freelanceJobId: gigId, freelancerId } });

    // Fire-and-forget — don't block the response
    this.notifications.notify(gig.clientId, {
      type: 'NEW_BID',
      title: 'New bid on your gig',
      body: `Someone submitted a bid of ${dto.amount.toLocaleString()} ETB on "${gig.title}".`,
      metadata: { bidId: bid.id, gigId },
    });

    return bid;
  }

  async acceptBid(bidId: string, clientId: string) {
    const bid = await this.prisma.bid.findFirst({
      where: { id: bidId, freelanceJob: { clientId } },
    });
    if (!bid) throw new NotFoundException('Bid not found');

    const contract = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Accept chosen bid, reject others
      await tx.bid.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } });
      await tx.bid.updateMany({
        where: { freelanceJobId: bid.freelanceJobId, id: { not: bidId } },
        data: { status: 'REJECTED' },
      });

      // Create contract
      const c = await tx.contract.create({
        data: { freelanceJobId: bid.freelanceJobId, clientId, freelancerId: bid.freelancerId, agreedAmount: bid.amount },
      });

      // Update gig status
      await tx.freelanceJob.update({
        where: { id: bid.freelanceJobId },
        data: { status: 'IN_PROGRESS' },
      });

      // Create a chat room for this contract
      await tx.chatRoom.create({
        data: {
          contractId: c.id,
          participants: { create: [{ userId: clientId }, { userId: bid.freelancerId }] },
        },
      });

      return c;
    });

    // Notify the winning freelancer — fire-and-forget
    const gig = await this.prisma.freelanceJob.findUnique({ where: { id: bid.freelanceJobId } });
    this.notifications.notify(bid.freelancerId, {
      type: 'BID_ACCEPTED',
      title: '🎉 Your bid was accepted!',
      body: `Your bid of ${bid.amount.toLocaleString()} ETB on "${gig?.title}" was accepted. A contract has been created.`,
      metadata: { contractId: contract.id, gigId: bid.freelanceJobId },
    });

    return contract;
  }

  async getMyBids(freelancerId: string) {
    return this.prisma.bid.findMany({
      where: { freelancerId },
      include: { freelanceJob: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyContracts(userId: string) {
    return this.prisma.contract.findMany({
      where: {
        OR: [{ clientId: userId }, { freelancerId: userId }],
      },
      include: {
        freelanceJob: {
          include: { escrowTx: true },
        },
        client: { select: { id: true, firstName: true, lastName: true } },
        freelancer: { select: { id: true, firstName: true, lastName: true } },
        milestones: true,
        dispute: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getContract(id: string) {
    const c = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        milestones: { include: { deliverables: true } },
        freelanceJob: { include: { escrowTx: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
        freelancer: { select: { id: true, firstName: true, lastName: true } },
        dispute: true,
      },
    }) as any;
    if (!c) throw new NotFoundException('Contract not found');
    return c;
  }

  async approveMilestone(milestoneId: string, clientId: string) {
    const m = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contract: { clientId } },
      include: { contract: true },
    });
    if (!m) throw new ForbiddenException('Not authorized or milestone not found');
    if (m.status !== 'SUBMITTED')
      throw new ForbiddenException('Milestone must be SUBMITTED before it can be approved');

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });

    this.notifications.notify(m.contract.freelancerId, {
      type: 'MILESTONE_APPROVED',
      title: '✅ Milestone approved!',
      body: `Your milestone "${m.title}" has been approved. Payment is being processed.`,
      metadata: { milestoneId, contractId: m.contractId, amount: m.amount },
    });

    return updated;
  }

  async createMilestone(
    contractId: string,
    clientId: string,
    dto: { title: string; description?: string; amount: number; deadline: string },
  ) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.clientId !== clientId)
      throw new ForbiddenException('Only the client can add milestones');
    if (contract.status !== 'ACTIVE')
      throw new ForbiddenException('Cannot add milestones to a non-active contract');

    return this.prisma.milestone.create({
      data: {
        contractId,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        deadline: new Date(dto.deadline),
        status: 'PENDING',
      },
      include: { deliverables: true },
    });
  }

  async startMilestone(milestoneId: string, freelancerId: string) {
    const m = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contract: { freelancerId } },
      include: { contract: true },
    });
    if (!m) throw new ForbiddenException('Not authorized or milestone not found');
    if (m.status !== 'PENDING')
      throw new ForbiddenException('Only PENDING milestones can be started');

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'IN_PROGRESS' },
      include: { deliverables: true },
    });

    this.notifications.notify(m.contract.clientId, {
      type: 'MILESTONE_STARTED',
      title: 'Milestone started',
      body: `The freelancer has started working on milestone "${m.title}".`,
      metadata: { milestoneId, contractId: m.contractId },
    });

    return updated;
  }

  async submitMilestone(
    milestoneId: string,
    freelancerId: string,
    dto: { fileUrl?: string; notes?: string },
  ) {
    const m = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contract: { freelancerId } },
      include: { contract: true },
    });
    if (!m) throw new ForbiddenException('Not authorized or milestone not found');
    if (m.status !== 'IN_PROGRESS')
      throw new ForbiddenException('Milestone must be IN_PROGRESS before submitting');

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const deliverable = await tx.deliverable.create({
        data: { milestoneId, fileUrl: dto.fileUrl, notes: dto.notes },
      });
      const updated = await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: 'SUBMITTED' },
        include: { deliverables: true },
      });
      return { milestone: updated, deliverable };
    });

    this.notifications.notify(m.contract.clientId, {
      type: 'MILESTONE_SUBMITTED',
      title: '📦 Milestone ready for review',
      body: `A deliverable has been submitted for milestone "${m.title}". Please review and approve.`,
      metadata: { milestoneId, contractId: m.contractId },
    });

    return result;
  }

  async requestRevision(milestoneId: string, clientId: string) {
    const m = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contract: { clientId } },
      include: { contract: true },
    });
    if (!m) throw new ForbiddenException('Not authorized or milestone not found');
    if (m.status !== 'SUBMITTED')
      throw new ForbiddenException('Milestone must be SUBMITTED to request revision');

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'REVISION_REQUESTED' },
      include: { deliverables: true },
    });

    this.notifications.notify(m.contract.freelancerId, {
      type: 'MILESTONE_REVISION',
      title: '🔄 Revision requested',
      body: `The client has requested a revision on milestone "${m.title}". Please update your deliverable.`,
      metadata: { milestoneId, contractId: m.contractId },
    });

    return updated;
  }

  async createDispute(userId: string, dto: { contractId: string; reason: string; evidenceUrls: string[] }) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenException('You are not a party to this contract');
    }

    // Check if dispute already exists
    const existingDispute = await this.prisma.dispute.findUnique({
      where: { contractId: dto.contractId },
    });
    if (existingDispute) {
      throw new ConflictException('A dispute already exists for this contract');
    }

    const dispute = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const d = await tx.dispute.create({
        data: {
          contractId: dto.contractId,
          raisedById: userId,
          reason: dto.reason,
          evidenceUrls: dto.evidenceUrls,
        },
      });

      await tx.contract.update({
        where: { id: dto.contractId },
        data: { status: 'DISPUTED' },
      });

      return d;
    });

    return dispute;
  }
}

