import { Processor, WorkerHost } from '@nestjs/bullmq';
import { SUBSCRIPTION_QUEUE } from './subscription.constant';
import { SubscriptionsService } from './subscriptions.service';
import { Job } from 'bullmq';

@Processor(SUBSCRIPTION_QUEUE)
export class SubscriptionProcessor extends WorkerHost {
  constructor(private readonly subscriptionService: SubscriptionsService) {
    super();
  }

  async process(job: Job<any>) {
    if (job.name === 'expire-subscription') {
      const { subscriptionId } = job.data;

      await this.subscriptionService.expireSubscription(subscriptionId);
    }

    if (job.name === 'renew-subscription') {
      const { subscriptionId } = job.data;

      await this.subscriptionService.renewSubscription(subscriptionId);
    }
  }
}
