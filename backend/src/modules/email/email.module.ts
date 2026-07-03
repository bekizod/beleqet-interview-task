import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * Global module — EmailService is available everywhere without
 * explicitly importing EmailModule in each feature module.
 */
@Global()
@Module({
  providers: [EmailService],
  exports:   [EmailService],
})
export class EmailModule {}
