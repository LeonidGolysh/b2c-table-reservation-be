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
    const { subscriptionId } = job.data;

    if (job.name === 'expire-subscription') {
      await this.subscriptionService.expireSubscription(subscriptionId);
      return;
    }

    if (job.name === 'renew-subscription') {
      await this.subscriptionService.renewSubscription(subscriptionId);
      return;
    }

    if (job.name === 'payment-reminder') {
      await this.subscriptionService.sendPaymentReminder(subscriptionId);
      return;
    }
  }
}
