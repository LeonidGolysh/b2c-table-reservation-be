import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  SUBSCRIPTION_JOBS,
  SUBSCRIPTION_QUEUE,
  SubscriptionJobName,
} from './subscription.constant';
import { SubscriptionsService } from './subscriptions.service';

interface SubscriptionJob {
  subscriptionId: number;
}

@Processor(SUBSCRIPTION_QUEUE)
export class SubscriptionProcessor extends WorkerHost {
  constructor(private readonly subscriptionService: SubscriptionsService) {
    super();
  }

  async process(job: Job<SubscriptionJob, unknown, SubscriptionJobName>) {
    const { subscriptionId } = job.data;

    switch (job.name) {
      case SUBSCRIPTION_JOBS.EXPIRE:
        await this.subscriptionService.expireSubscription(subscriptionId);
        break;

      case SUBSCRIPTION_JOBS.RENEW:
        await this.subscriptionService.renewSubscription(subscriptionId);
        break;

      case SUBSCRIPTION_JOBS.PAYMENT_REMINDER:
        await this.subscriptionService.sendPaymentReminder(subscriptionId);
        break;
    }
  }
}
