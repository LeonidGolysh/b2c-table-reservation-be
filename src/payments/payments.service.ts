import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'node_modules/stripe/esm/stripe.esm.node';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { PaymentStatus } from './payment-status.enum';
import { Subscription } from 'src/subscriptions/subscription.entity';
import { InvoiceWithSubscription } from 'src/subscriptions/interface/invoice-subscription.interface';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async findLatestSuccessfulPaymentBySubscriptionId(
    subscriptionId: number,
  ): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: {
        subscription: {
          id: subscriptionId,
        },
        status: PaymentStatus.SUCCEEDED,
      },
      relations: {
        subscription: true,
        restaurant: {
          owner: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByRestaurantId(restaurantId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { restaurant: { id: restaurantId } },
      relations: {
        subscription: true,
        restaurant: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdWithRelations(paymentId: number): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: {
        restaurant: { owner: true },
        subscription: true,
      },
    });
  }

  // The caller resolves the subscription (with its restaurant) so this module
  // doesn't depend on SubscriptionsModule.
  async createFromCheckout(
    session: Stripe.Checkout.Session,
    subscription: Subscription,
  ) {
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout payment is not completed');
    }

    const existing = await this.paymentRepository.findOne({
      where: { stripeSessionId: session.id },
    });

    if (existing) {
      return existing;
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
    invoice: Stripe.Invoice & InvoiceWithSubscription,
    subscription: Subscription,
  ) {
    const existing = await this.paymentRepository.findOne({
      where: { stripeInvoiceId: invoice.id },
    });

    if (existing) {
      return existing;
    }

    const stripeSubscriptionId =
      invoice.parent?.subscription_details?.subscription;

    if (!stripeSubscriptionId) {
      throw new NotFoundException('No Stripe subscription id');
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
