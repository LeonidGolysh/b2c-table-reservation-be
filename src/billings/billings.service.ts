import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentsService } from 'src/payments/payments.service';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { BillingRestaurantResponseDto } from './dto/billing-restaurant-response.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaymentStatus } from 'src/payments/payment-status.enum';
import { Subscription } from 'src/subscriptions/subscription.entity';
import { BillingSubscriptionResponseDto } from './dto/billing-subscription-response.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { SubscriptionNotFoundException } from 'src/subscriptions/exceptions/subscription-not-found.exception';
import { StripeService } from 'src/stripe/stripe.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class BillingsService {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly paymentService: PaymentsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly stripeService: StripeService,
  ) {}

  private mapSubscription(
    subscription: Subscription,
  ): BillingSubscriptionResponseDto {
    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      renewalType: subscription.renewalType,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      daysRemaining: Math.max(
        0,
        Math.ceil((subscription.endDate.getTime() - Date.now()) / DAY_MS),
      ),
    };
  }

  async getCurrentBilling(restaurantId: number, ownerId: number) {
    const restaurant = await this.restaurantsService.findOwnedByIdOrThrow(
      restaurantId,
      ownerId,
      { subscriptions: true },
    );

    const subscription = restaurant.subscriptions;

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        isActive: restaurant.isActive,
      },
      subscription: this.mapSubscription(subscription),
    };
  }

  async getPaymentHistory(
    restaurantId: number,
    ownerId: number,
  ): Promise<PaymentResponseDto[]> {
    await this.restaurantsService.findOwnedByIdOrThrow(restaurantId, ownerId);

    const payments = await this.paymentService.findByRestaurantId(restaurantId);

    return payments.map((payment) => ({
      id: payment.id,
      subscriptionId: payment.subscription?.id ?? null,
      restaurantId: payment.restaurant?.id ?? restaurantId,
      stripeSessionId: payment.stripeSessionId ?? null,
      stripePaymentIntentId: payment.stripePaymentIntentId ?? null,
      stripeInvoiceId: payment.stripeInvoiceId ?? null,
      stripeSubscriptionId: payment.stripeSubscriptionId ?? null,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status as PaymentStatus,
      createdAt: payment.createdAt,
    }));
  }

  async getRestaurantsByOwner(
    ownerId: number,
  ): Promise<BillingRestaurantResponseDto[]> {
    if (!ownerId) {
      throw new UnauthorizedException('ownerId is missing');
    }

    const restaurants = await this.restaurantsService.findAllByOwner(ownerId, {
      subscriptions: true,
    });

    return restaurants.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      isActive: restaurant.isActive,
      subscription: restaurant.subscriptions
        ? this.mapSubscription(restaurant.subscriptions)
        : null,
    }));
  }

  async checkout(
    restaurantId: number,
    ownerId: number,
  ): Promise<CheckoutResponseDto> {
    const restaurant = await this.restaurantsService.findOwnedByIdOrThrow(
      restaurantId,
      ownerId,
      { subscriptions: true },
    );

    if (!restaurant.subscriptions) {
      throw new SubscriptionNotFoundException();
    }

    const subscription = await this.subscriptionsService.startCheckout(
      restaurant.subscriptions.id,
    );

    const session =
      await this.stripeService.createCheckoutSession(subscription);

    if (!session.url) {
      throw new BadRequestException('Stripe checkout URL was not returned');
    }

    await this.restaurantsService.markPending(restaurant.id);

    return {
      checkoutUrl: session.url,
    };
  }
}
