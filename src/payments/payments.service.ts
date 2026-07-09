import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'node_modules/stripe/esm/stripe.esm.node';
import { Subscription } from 'src/subscriptions/subscription.entity';
import { Not, Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { PaymentStatus } from './payment-status.enum';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,

    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async createFromCheckout(session: Stripe.Checkout.Session) {
    const existing = await this.paymentRepository.findOne({
      where: { stripeSessionId: session.id },
    });

    if (existing) {
      return existing;
    }

    const subscriptionId = Number(session.metadata?.subscriptionId);
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: { restaurant: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

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

    const subscription = await this.subscriptionRepo.findOne({
      where: { stripeSubscriptionId },
      relations: { restaurant: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

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
