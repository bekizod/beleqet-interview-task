import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { QUEUE_NAMES } from '../queues/queues.constants';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.NOTIFICATIONS }),
    PrismaModule,
    EmailModule,
  ],
  providers: [NotificationsProcessor, NotificationsService],
  exports: [NotificationsProcessor, NotificationsService],
})
export class NotificationsModule {}
