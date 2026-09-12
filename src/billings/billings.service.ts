import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from 'src/payments/payment.entity';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { RestaurantNotFoundException } from 'src/restaurants/exceptions/restaurant-not-found.exception';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { Repository } from 'typeorm';
import { BillingRestaurantResponseDto } from './dto/billing-restaurant-response.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaymentStatus } from 'src/payments/payment-status.enum';

@Injectable()
export class BillingsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,

    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    private readonly restaurantService: RestaurantsService,
  ) {}

  private async getRestaurantForOwner(
    restaurantId: number,
    ownerId: number,
    withSubscriptions: boolean,
  ) {
    // const restaurant = await this.restaurantService.findOne(restaurantId);
    const restaurant = await this.restaurantRepository.findOne({
      where: {
        id: restaurantId,
        owner: {
          id: ownerId,
        },
      },
      relations: {
        subscriptions: withSubscriptions,
      },
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException(restaurantId);
    }

    return restaurant;
  }

  async getCurrentBilling(restaurantId: number, ownerId: number) {
    const restaurant = await this.getRestaurantForOwner(
      restaurantId,
      ownerId,
      true,
    );

    const subscription = restaurant.subscriptions;

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const dayRemaining = Math.max(
      0,
      Math.ceil(
        (subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ),
    );

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        isActive: restaurant.isActive,
      },

      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,

        renewalType: subscription.renewalType,

        startDate: subscription.startDate,
        endDate: subscription.endDate,

        dayRemaining,
      },
    };
  }

  async getPaymentHistory(
    restaurantId: number,
    ownerId: number,
  ): Promise<PaymentResponseDto[]> {
    await this.getRestaurantForOwner(restaurantId, ownerId, false);

    const payments = await this.paymentRepository.find({
      where: {
        restaurant: {
          id: restaurantId,
        },
      },
      relations: {
        subscription: true,
        restaurant: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

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

    const restaurants = this.restaurantRepository.find({
      where: {
        owner: {
          id: ownerId,
        },
      },
      relations: {
        subscriptions: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return (await restaurants).map((restaurant) => {
      const subscription = restaurant.subscriptions;
      const daysRemaining = subscription
        ? Math.max(
            0,
            Math.ceil(
              (subscription.endDate.getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : null;

      return {
        id: restaurant.id,
        name: restaurant.name,
        isActive: restaurant.isActive,

        subscription: restaurant.subscriptions
          ? {
              id: restaurant.subscriptions.id,
              plan: restaurant.subscriptions.plan,
              status: restaurant.subscriptions.status,
              renewalType: restaurant.subscriptions.renewalType,
              startDate: restaurant.subscriptions.startDate,
              endDate: restaurant.subscriptions.endDate,
              daysRemaining,
            }
          : null,
      };
    });
  }
}
