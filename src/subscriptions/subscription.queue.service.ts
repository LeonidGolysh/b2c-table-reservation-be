import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  SUBSCRIPTION_JOBS,
  SUBSCRIPTION_QUEUE,
  SubscriptionJobName,
} from './subscription.constant';

@Injectable()
export class SubscriptionQueueService {
  constructor(
    @InjectQueue(SUBSCRIPTION_QUEUE)
    private readonly queue: Queue,
  ) {}

  private jobId(
    subscriptionId: number,
    jobName: 'expire' | 'renew' | 'payment-reminder',
  ): string {
    return `subscription-${subscriptionId}-${jobName}`;
  }

  private async removeExistingJob(jobId: string): Promise<void> {
    const existingJob = await this.queue.getJob(jobId);

    if (existingJob) {
      await existingJob.remove();
    }
  }

  private async schedule(
    jobName: SubscriptionJobName,
    jobId: string,
    subscriptionId: number,
    delayMs: number,
  ): Promise<void> {
    await this.queue.add(
      jobName,
      { subscriptionId },
      {
        jobId,
        delay: delayMs,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async scheduleExpiration(subscriptionId: number, delayMs: number) {
    const jobId = this.jobId(subscriptionId, 'expire');

    await this.schedule(
      SUBSCRIPTION_JOBS.EXPIRE,
      jobId,
      subscriptionId,
      delayMs,
    );
  }

  async rescheduleExpiration(subscriptionId: number, delayMs: number) {
    const jobId = this.jobId(subscriptionId, 'expire');

    await this.removeExistingJob(jobId);
    await this.schedule(
      SUBSCRIPTION_JOBS.EXPIRE,
      jobId,
      subscriptionId,
      delayMs,
    );
  }

  async rescheduleRenewal(subscriptionId: number, delayMs: number) {
    const jobId = this.jobId(subscriptionId, 'renew');

    await this.removeExistingJob(jobId);
    await this.schedule(
      SUBSCRIPTION_JOBS.RENEW,
      jobId,
      subscriptionId,
      delayMs,
    );
  }

  async cancelRenewal(subscriptionId: number) {
    await this.removeExistingJob(this.jobId(subscriptionId, 'renew'));
  }

  async schedulePaymentReminder(
    subscriptionId: number,
    delayMs: number,
  ): Promise<void> {
    const jobId = this.jobId(subscriptionId, 'payment-reminder');

    await this.removeExistingJob(jobId);
    await this.schedule(
      SUBSCRIPTION_JOBS.PAYMENT_REMINDER,
      jobId,
      subscriptionId,
      delayMs,
    );
  }

  async cancelPaymentReminder(subscriptionId: number): Promise<void> {
    await this.removeExistingJob(
      this.jobId(subscriptionId, 'payment-reminder'),
    );
  }
}
