import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PaymentService } from 'src/payments/payments.service';
import { MAIL_JOBS, MAIL_QUEUE } from './mail.constant';
import { MailService } from './mail.service';

interface SubscriptionPaymentEmailJob {
  paymentId: number;
}

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailService: MailService,
    private readonly paymentService: PaymentService,
  ) {
    super();
  }

  async process(job: Job<SubscriptionPaymentEmailJob>) {
    if (job.name !== MAIL_JOBS.SUBSCRIPTION_PAYMENT) {
      return;
    }

    const { paymentId } = job.data;
    const payment = await this.paymentService.findByIdWithRelations(paymentId);

    if (!payment) {
      this.logger.warn(`Payment ${paymentId} not found, skipping email`);
      return;
    }

    const owner = payment.restaurant?.owner;

    if (!owner?.email || !payment.restaurant || !payment.subscription) {
      this.logger.warn(`Cannot send payment email for payment ${paymentId}`);
      return;
    }

    await this.mailService.sendSubscriptionPaymentEmail({
      email: owner.email,
      customerName: owner.name,
      restaurantName: payment.restaurant.name,
      amount: payment.amount,
      currency: payment.currency,
      billingDate: payment.createdAt,
      subscriptionEndDate: payment.subscription.endDate,
      stripePaymentId: payment.stripePaymentIntentId,
    });
  }
}
