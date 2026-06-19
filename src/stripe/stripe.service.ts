import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'node_modules/stripe/esm/stripe.esm.node';
import { SubscriptionPlan } from 'src/subscriptions/enum/subscription-plan.enum';
import { Subscription } from 'src/subscriptions/subscription.entity';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { Repository } from 'typeorm';
import { StripeEvent } from './stripe-event.entity';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,

    @InjectRepository(StripeEvent)
    private stripeEvent: Repository<StripeEvent>,

    private readonly subscriptionService: SubscriptionsService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-05-27.dahlia',
    });
  }

  private getPriceId(plan: SubscriptionPlan): string {
    switch (plan) {
      case SubscriptionPlan.TST:
        return process.env.STRIPE_PRICE_TEST!;

      case SubscriptionPlan.MTH:
        return process.env.STRIPE_PRICE_MONTH!;
    }
  }

  get client(): Stripe {
    return this.stripe;
  }

  async createCheckoutSession(
    subscription: Subscription,
  ): Promise<Stripe.Checkout.Session> {
    const session = this.client.checkout.sessions.create({
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
      },

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

    await this.handleCheckoutCompleted(session);
    await this.markAsProcessed(event);
  }

  private async isProcessed(eventId: string): Promise<boolean> {
    const exists = await this.stripeEvent.findOne({
      where: { stripeEventId: eventId },
    });

    return !!exists;
  }

  private async markAsProcessed(event: Stripe.Event) {
    await this.stripeEvent.save({
      stripeEventId: event.id,
      type: event.type,
    });
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const subscriptionId = session.metadata?.subscriptionId;

    if (!subscriptionId) {
      throw new Error('No subscriptionId in metadata');
    }

    await this.subscriptionService.activeSubscription(Number(subscriptionId));
  }

  async testConnection() {
    return this.client.balance.retrieve();
  }
}
