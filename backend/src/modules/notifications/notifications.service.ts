import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../queues/queues.constants';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private readonly notifQueue: Queue,
  ) {}

  /**
   * Send an in-app notification AND a Telegram DM (if the user has linked
   * their Telegram ID in their profile).
   */
  async notify(userId: string, payload: {
    type: string;
    title: string;
    body: string;
    metadata?: object;
  }) {
    // Always enqueue in-app
    await this.notifQueue.add(NOTIFICATION_JOBS.SEND_IN_APP, {
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      metadata: payload.metadata,
    });

    // Send Telegram if user has linked their account
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true },
    });
    if (user?.telegramId) {
      const message = `*${payload.title}*\n${payload.body}`;
      await this.notifQueue.add(NOTIFICATION_JOBS.SEND_TELEGRAM, {
        telegramId: user.telegramId,
        message,
      });
    }
  }
}
