import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MAIL_JOBS, MAIL_QUEUE } from './mail.constant';

@Injectable()
export class MailQueueService {
  constructor(
    @InjectQueue(MAIL_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueueSubscriptionPaymentEmail(paymentId: number): Promise<void> {
    await this.queue.add(
      MAIL_JOBS.SUBSCRIPTION_PAYMENT,
      { paymentId },
      {
        jobId: `payment-${paymentId}-email`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
