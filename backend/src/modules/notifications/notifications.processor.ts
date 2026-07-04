import { Processor, Process } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../queues/queues.constants';
import { EmailService } from '../email/email.service';

interface InAppPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: object;
}

interface TelegramPayload {
  telegramId: string;
  message: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATIONS)
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  @Process(NOTIFICATION_JOBS.SEND_IN_APP)
  async sendInApp(job: Job<InAppPayload>) {
    const { userId, type, title, body, metadata } = job.data;
    if (!userId) return;
    await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        channel: 'IN_APP',
        metadata: metadata as never,
      },
    });
    this.logger.debug(`In-app → ${userId}: ${title}`);
  }

  @Process(NOTIFICATION_JOBS.SEND_TELEGRAM)
  async sendTelegram(job: Job<TelegramPayload>) {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — skipping');
      return;
    }

    const { telegramId, message } = job.data;

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramId,
            text: message,
            // Use HTML instead of Markdown — far fewer special-char edge cases
            parse_mode: 'HTML',
          }),
        },
      );

      const data = await res.json() as { ok: boolean; error_code?: number; description?: string };

      if (!data.ok) {
        this.logger.error(
          `Telegram sendMessage failed for chat_id=${telegramId}: ` +
          `[${data.error_code}] ${data.description}`,
        );
      } else {
        this.logger.log(`Telegram ✓ → ${telegramId}`);
      }
    } catch (e) {
      this.logger.error(`Telegram fetch error for chat_id=${telegramId}: ${(e as Error).message}`);
    }
  }

  /** Handles ad-hoc raw HTML emails enqueued from other modules. */
  @Process(NOTIFICATION_JOBS.SEND_EMAIL)
  async sendEmail(job: Job<EmailPayload>) {
    const { to, subject, html } = job.data;
    if (!to) return;
    await this.emailService.sendRaw({ to, subject, html });
  }
}
