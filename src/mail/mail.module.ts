import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PaymentsModule } from 'src/payments/payments.module';
import { MAIL_QUEUE } from './mail.constant';
import { MailProcessor } from './mail.processor';
import { MailQueueService } from './mail.queue.service';
import { MailService } from './mail.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Email } from './entity/email.entity';
import { MailController } from './mail.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Email]),
    PaymentsModule,
    BullModule.registerQueue({
      name: MAIL_QUEUE,
    }),
  ],
  controllers: [MailController],
  providers: [MailService, MailQueueService, MailProcessor],
  exports: [MailQueueService, MailService],
})
export class MailModule {}
