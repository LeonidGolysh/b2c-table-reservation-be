import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { EntityManager, Repository } from 'typeorm';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { SubscriptionStatus } from './enum/subscription-status.enum';
import { ResponseSubscriptionDto } from './dto/response-subscription.dto';
import { SubscriptionPlan } from './enum/subscription-plan.enum';
import { SubscriptionRenewalType } from './enum/subscription-renewal-type.enum';
import { SubscriptionQueueService } from './subscription.queue.service';
import { AUTO_RENEWAL_GRACE_PERIOD_MS } from './subscription.constant';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,

    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,

    private readonly subscriptionQueueService: SubscriptionQueueService,
  ) {}

  private mapToResponse(subscription: Subscription): ResponseSubscriptionDto {
    return {
      id: subscription.id,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      createdAt: subscription.createdAt,
      renewalType: subscription.renewalType,
    };
  }

  async create(restaurantId: number, plan: SubscriptionPlan) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return this.createForRestaurant(restaurant, plan);
  }

  async createForRestaurant(
    restaurant: Restaurant,
    plan: SubscriptionPlan,
    renewalType?: SubscriptionRenewalType,
    manager?: EntityManager,
  ) {
    const startDate = new Date();
    const endDate = new Date(startDate);

    switch (plan) {
      case SubscriptionPlan.TEST:
        endDate.setMinutes(endDate.getMinutes() + 3);
        break;

      case SubscriptionPlan.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }

    const repo = manager
      ? manager.getRepository(Subscription)
      : this.subscriptionRepo;

    const subscription = repo.create({
      restaurant,
      plan,
      status: SubscriptionStatus.PENDING,
      startDate,
      endDate,
      ...(renewalType && { renewalType }),
    });

    return repo.save(subscription);
  }

  // Stripe can't bill on a minute-scale cycle (1 day minimum), so the TEST
  // plan keeps its fast local schedule instead of syncing to Stripe's period.
  private usesStripeSchedule(subscription: Subscription): boolean {
    return (
      subscription.renewalType === SubscriptionRenewalType.AUTO &&
      subscription.plan !== SubscriptionPlan.TEST
    );
  }

  // TEST plans auto-renew on a self-scheduled local job instead of waiting on
  // Stripe's invoice.payment_succeeded webhook, which can't arrive faster than
  // Stripe's 1-day billing minimum.
  private usesLocalAutoRenewal(subscription: Subscription): boolean {
    return (
      subscription.renewalType === SubscriptionRenewalType.AUTO &&
      subscription.plan === SubscriptionPlan.TEST
    );
  }

  private getExpirationDelay(subscription: Subscription): number {
    const delay = subscription.endDate.getTime() - Date.now();

    if (subscription.renewalType === SubscriptionRenewalType.AUTO) {
      return delay + (AUTO_RENEWAL_GRACE_PERIOD_MS[subscription.plan] ?? 0);
    }

    return delay;
  }

  private async scheduleRenewalIfNeeded(subscription: Subscription) {
    if (!this.usesLocalAutoRenewal(subscription)) {
      return;
    }

    const delay = subscription.endDate.getTime() - Date.now();

    if (delay > 0) {
      await this.subscriptionQueueService.rescheduleRenewal(
        subscription.id,
        delay,
      );
    }
  }

  async activeSubscription(subscriptionId: number, stripePeriodEnd?: Date) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: { restaurant: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.restaurant.isActive = true;

    if (this.usesStripeSchedule(subscription) && stripePeriodEnd) {
      subscription.endDate = stripePeriodEnd;
    }

    await this.restaurantRepository.save(subscription.restaurant);

    const savedSubScription = await this.subscriptionRepo.save(subscription);
    const delay = this.getExpirationDelay(savedSubScription);

    if (delay > 0) {
      await this.subscriptionQueueService.rescheduleExpiration(
        savedSubScription.id,
        delay,
      );
    }

    await this.scheduleRenewalIfNeeded(savedSubScription);

    return savedSubScription;
  }

  async expireSubscription(subscriptionId: number) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: { restaurant: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.subscriptionQueueService.cancelRenewal(subscription.id);

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return subscription;
    }

    subscription.status = SubscriptionStatus.EXPIRED;
    subscription.restaurant.isActive = false;

    await this.restaurantRepository.save(subscription.restaurant);
    return this.subscriptionRepo.save(subscription);
  }

  async checkoutExpired(subscriptionId: number) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: { restaurant: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.CHECKOUT) {
      return;
    }

    subscription.status = SubscriptionStatus.PENDING;

    await this.subscriptionRepo.save(subscription);
  }

  async attachStripeData(
    subscriptionId: number,
    customerId: string,
    stripeSubscriptionId: string,
  ) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException();
    }

    subscription.stripeCustomerId = customerId;
    subscription.stripeSubscriptionId = stripeSubscriptionId;

    await this.subscriptionRepo.save(subscription);
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string) {
    return await this.subscriptionRepo.findOne({
      where: { stripeSubscriptionId },
      relations: {
        restaurant: true,
      },
    });
  }

  async renewSubscription(subscriptionId: number, stripePeriodEnd?: Date) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: { restaurant: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const startDate = new Date();
    let endDate = new Date(startDate);

    switch (subscription.plan) {
      case SubscriptionPlan.TEST:
        endDate.setMinutes(endDate.getMinutes() + 2);
        break;

      case SubscriptionPlan.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }

    if (this.usesStripeSchedule(subscription) && stripePeriodEnd) {
      endDate = stripePeriodEnd;
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.startDate = startDate;
    subscription.endDate = endDate;

    subscription.restaurant.isActive = true;

    await this.restaurantRepository.save(subscription.restaurant);

    const savedSubScription = await this.subscriptionRepo.save(subscription);
    const delay = this.getExpirationDelay(savedSubScription);

    if (delay > 0) {
      await this.subscriptionQueueService.rescheduleExpiration(
        savedSubScription.id,
        delay,
      );
    }

    await this.scheduleRenewalIfNeeded(savedSubScription);

    return savedSubScription;
  }
}
