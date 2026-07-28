import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'node_modules/stripe/esm/stripe.esm.node';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { PaymentStatus } from './payment-status.enum';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async createFromCheckout(session: Stripe.Checkout.Session) {
    const existing = await this.paymentRepository.findOne({
      where: { stripeSessionId: session.id },
    });

    if (existing) {
      return existing;
    }

    const subscriptionId = Number(session.metadata?.subscriptionId);
    const subscription =
      await this.subscriptionsService.findById(subscriptionId);

    const payment = this.paymentRepository.create({
      subscription,
      restaurant: subscription.restaurant,

      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      stripeSubscriptionId: session.subscription as string,

      amount: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      status: PaymentStatus.SUCCEEDED,
    });

    return await this.paymentRepository.save(payment);
  }

  async createFromInvoice(
    invoice: Stripe.Invoice & {
      parent?: {
        subscription_details?: {
          subscription?: string;
        };
      };
    },
  ) {
    const existing = await this.paymentRepository.findOne({
      where: { stripeInvoiceId: invoice.id },
    });

    if (existing) {
      return existing;
    }

    const stripeSubscriptionId =
      invoice.parent?.subscription_details.subscription;

    if (!stripeSubscriptionId) {
      throw new NotFoundException('No Stripe subscription id');
    }

    const subscription =
      await this.subscriptionsService.findByStripeSubscriptionIdOrThrow(
        stripeSubscriptionId,
      );

    const payment = this.paymentRepository.create({
      subscription,
      restaurant: subscription.restaurant,

      stripeInvoiceId: invoice.id,
      stripeSubscriptionId,

      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: PaymentStatus.SUCCEEDED,
    });

    return this.paymentRepository.save(payment);
  }
}
