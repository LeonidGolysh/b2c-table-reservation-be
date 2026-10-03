import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PaymentModule } from 'src/payments/payments.module';
import { MAIL_QUEUE } from './mail.constant';
import { MailProcessor } from './mail.processor';
import { MailQueueService } from './mail.queue.service';
import { MailService } from './mail.service';

@Module({
  imports: [
    PaymentModule,
    BullModule.registerQueue({
      name: MAIL_QUEUE,
    }),
  ],
  providers: [MailService, MailQueueService, MailProcessor],
  exports: [MailQueueService, MailService],
})
export class MailModule {}
