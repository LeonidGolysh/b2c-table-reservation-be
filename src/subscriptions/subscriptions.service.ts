import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { EntityManager, Repository } from 'typeorm';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { SubscriptionStatus } from './enum/subscription-status.enum';
import { ResponseSubscriptionDto } from './dto/response-subscription.dto';
import { SubscriptionPlan } from './enum/subscription-plan.enum';
import { SubscriptionRenewalType } from './enum/subscription-renewal-type.enum';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,

    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
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
      case SubscriptionPlan.TST:
        endDate.setMinutes(endDate.getMinutes() + 1);
        break;

      case SubscriptionPlan.MTH:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }

    const repo = manager
      ? manager.getRepository(Subscription)
      : this.subscriptionRepo;

    const subscription = repo.create({
      restaurant,
      plan,
      status: SubscriptionStatus.PEN,
      startDate,
      endDate,
      ...(renewalType && { renewalType }),
    });

    return repo.save(subscription);
  }

  async activeSubscription(subscriptionId: number) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: { restaurant: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = SubscriptionStatus.ACT;
    subscription.restaurant.isActive = true;

    await this.restaurantRepository.save(subscription.restaurant);
    return this.subscriptionRepo.save(subscription);
  }

  async expireSubscription(subscriptionId: number) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: { restaurant: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = SubscriptionStatus.EXP;
    subscription.restaurant.isActive = false;

    await this.restaurantRepository.save(subscription.restaurant);
    return this.subscriptionRepo.save(subscription);
  }
}
