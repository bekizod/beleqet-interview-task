import { Module } from '@nestjs/common';
import { FreelanceService } from './freelance.service';
import { FreelanceController } from './freelance.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [FreelanceService],
  controllers: [FreelanceController],
  exports: [FreelanceService],
})
export class FreelanceModule {}
