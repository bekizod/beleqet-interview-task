import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../queues/queues.constants';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private readonly notifQueue: Queue,
  ) { }

  async notify(userId: string, payload: {
    type: string;
    title: string;
    body: string;
    metadata?: object;
  }) {
    this.logger.log(`notify() userId=${userId} type=${payload.type}`);

    // ── 1. Telegram — fire immediately, never blocks response ──────────────
    // Run DB lookup + HTTP send in a detached promise so nothing can stall it
    this.prisma.user.findUnique({ where: { id: userId }, select: { telegramId: true } })
      .then(user => {
        this.logger.log(`telegramId for userId=${userId}: ${user?.telegramId ?? 'NULL'}`);
        if (user?.telegramId) {
          this.sendTelegramDirect(user.telegramId, `<b>${payload.title}</b>\n${payload.body}`);
        }
      })
      .catch(err => this.logger.error(`Telegram lookup failed userId=${userId}: ${err.message}`));

    // ── 2. In-app via Bull queue — best effort ──────────────────────────────
    this.notifQueue.add(NOTIFICATION_JOBS.SEND_IN_APP, {
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      metadata: payload.metadata,
    }).catch(err => this.logger.error(`In-app queue failed userId=${userId}: ${err.message}`));
  }

  private sendTelegramDirect(chatId: string, text: string): void {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || token === 'your_bot_token_here') {
      this.logger.warn('TELEGRAM_BOT_TOKEN missing — skipping');
      return;
    }

    this.logger.log(`Sending Telegram DM → chat_id=${chatId}`);

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
      .then(res => res.json())
      .then((data: any) => {
        if (data.ok) {
          this.logger.log(`Telegram ✓ sent to ${chatId}`);
        } else {
          this.logger.error(`Telegram ✗ ${chatId}: [${data.error_code}] ${data.description}`);
        }
      })
      .catch(err => this.logger.error(`Telegram HTTP error ${chatId}: ${err.message}`));
  }
}
