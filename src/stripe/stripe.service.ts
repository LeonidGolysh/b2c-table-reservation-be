import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'node_modules/stripe/esm/stripe.esm.node';
import { SubscriptionPlan } from 'src/subscriptions/enum/subscription-plan.enum';
import { Subscription } from 'src/subscriptions/subscription.entity';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { Repository } from 'typeorm';
import { StripeEvent } from './stripe-event.entity';
import { PaymentService } from 'src/payments/payments.service';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(StripeEvent)
    private stripeEvent: Repository<StripeEvent>,

    private readonly subscriptionService: SubscriptionsService,
    private readonly paymentService: PaymentService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-05-27.dahlia',
    });
  }

  private getPriceId(plan: SubscriptionPlan): string {
    switch (plan) {
      case SubscriptionPlan.TEST:
        return process.env.STRIPE_PRICE_TEST!;

      case SubscriptionPlan.MONTHLY:
        return process.env.STRIPE_PRICE_MONTH!;
    }
  }

  get client(): Stripe {
    return this.stripe;
  }

  private async getSubscriptionPeriodEnd(
    stripeSubscriptionId: string,
  ): Promise<Date | undefined> {
    const stripeSubscription =
      await this.client.subscriptions.retrieve(stripeSubscriptionId);
    const periodEndSeconds =
      stripeSubscription.items.data[0]?.current_period_end;

    return periodEndSeconds ? new Date(periodEndSeconds * 1000) : undefined;
  }

  async createCheckoutSession(
    subscription: Subscription,
  ): Promise<Stripe.Checkout.Session> {
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
    const session = await this.client.checkout.sessions.create({
      mode: 'subscription',

      line_items: [
        {
          price: this.getPriceId(subscription.plan),
          quantity: 1,
        },
      ],

      metadata: {
        subscriptionId: subscription.id.toString(),
        restaurantId: subscription.restaurant.id.toString(),
        ownerId: subscription.restaurant.owner.id.toString(),
        renewalType: subscription.renewalType,
      },

      expires_at: expiresAt,

      success_url: 'http://localhost:3000/payment/success',
      cancel_url: 'http://localhost:3000/payment/cancel',
    });

    return session;
  }

  async handleWebhook(body: Buffer, signature: string) {
    const event = this.client.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event);
        break;

      case 'checkout.session.expired':
        await this.handleCheckoutSessionExpired(event);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaid(event);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event);
        break;

      default:
        console.log(event.type);
    }

    return {
      received: true,
    };
  }

  private async handleCheckoutSessionCompleted(event: Stripe.Event) {
    if (await this.isProcessed(event.id)) {
      return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const inserted = await this.markAsProcessed(event);

    if (!inserted) {
      return;
    }

    await this.handleCheckoutCompleted(session);
  }

  private async handleCheckoutSessionExpired(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = Number(session.metadata?.subscriptionId);

    if (!subscriptionId) {
      return;
    }

    await this.subscriptionService.checkoutExpired(subscriptionId);
  }

  private async isProcessed(eventId: string): Promise<boolean> {
    const exists = await this.stripeEvent.findOne({
      where: { stripeEventId: eventId },
    });

    return !!exists;
  }

  private async markAsProcessed(event: Stripe.Event) {
    const result = await this.stripeEvent
      .createQueryBuilder()
      .insert()
      .into(StripeEvent)
      .values({
        stripeEventId: event.id,
        type: event.type,
      })
      .orIgnore()
      .execute();

    return result.identifiers.length > 0;
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const subscriptionId = session.metadata?.subscriptionId;

    if (!subscriptionId) {
      throw new BadRequestException('No subscriptionId in metadata');
    }

    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    await this.subscriptionService.attachStripeData(
      Number(subscriptionId),
      stripeCustomerId,
      stripeSubscriptionId,
    );

    const stripePeriodEnd =
      await this.getSubscriptionPeriodEnd(stripeSubscriptionId);

    await this.paymentService.createFromCheckout(session);
    await this.subscriptionService.activeSubscription(
      Number(subscriptionId),
      stripePeriodEnd,
    );
  }

  async testConnection() {
    return this.client.balance.retrieve();
  }

  private async handleInvoicePaid(event: Stripe.Event) {
    const invoice = event.data.object as any;
    const stripeSubscriptionId = invoice.parent?.subscription_details
      ?.subscription as string;

    if (invoice.billing_reason === 'subscription_create') {
      return;
    }

    const subscription =
      await this.subscriptionService.findByStripeSubscriptionId(
        stripeSubscriptionId,
      );

    if (!subscription) {
      return;
    }

    const stripePeriodEnd =
      await this.getSubscriptionPeriodEnd(stripeSubscriptionId);

    await this.paymentService.createFromInvoice(invoice);
    await this.subscriptionService.renewSubscription(
      subscription.id,
      stripePeriodEnd,
    );
  }

  private async handleInvoicePaymentFailed(event: Stripe.Event) {
    const invoice = event.data.object as any;
    const stripeSubscriptionId = invoice.parent?.subscription_details
      ?.subscription as string;

    if (invoice.billing_reason === 'subscription_create') {
      return;
    }

    const subscription =
      await this.subscriptionService.findByStripeSubscriptionId(
        stripeSubscriptionId,
      );

    if (!subscription) {
      return;
    }

    await this.subscriptionService.expireSubscription(subscription.id);
  }
}
