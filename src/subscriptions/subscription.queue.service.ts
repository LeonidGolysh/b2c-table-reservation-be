import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { SUBSCRIPTION_QUEUE } from './subscription.constant';

@Injectable()
export class SubscriptionQueueService {
  constructor(
    @InjectQueue(SUBSCRIPTION_QUEUE)
    private readonly queue: Queue,
  ) {}

  async scheduleExpiration(subscriptionId: number, delayMs: number) {
    const jobId = `subscription-${subscriptionId}-expire`;

    await this.queue.add(
      'expire-subscription',
      { subscriptionId },
      {
        jobId,
        delay: delayMs,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async rescheduleExpiration(subscriptionId: number, delayMs: number) {
    const jobId = `subscription-${subscriptionId}-expire`;
    const existingJob = await this.queue.getJob(jobId);

    if (existingJob) {
      await existingJob.remove();
    }

    await this.queue.add(
      'expire-subscription',
      { subscriptionId },
      {
        jobId,
        delay: delayMs,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async rescheduleRenewal(subscriptionId: number, delayMs: number) {
    const jobId = `subscription-${subscriptionId}-renew`;
    const existingJob = await this.queue.getJob(jobId);

    if (existingJob) {
      await existingJob.remove();
    }

    await this.queue.add(
      'renew-subscription',
      { subscriptionId },
      {
        jobId,
        delay: delayMs,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async cancelRenewal(subscriptionId: number) {
    const jobId = `subscription-${subscriptionId}-renew`;
    const existingJob = await this.queue.getJob(jobId);

    if (existingJob) {
      await existingJob.remove();
    }
  }
}
