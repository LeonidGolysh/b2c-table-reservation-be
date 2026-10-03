import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { EntityManager, FindOptionsRelations, Repository } from 'typeorm';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { SubscriptionStatus } from './enum/subscription-status.enum';
import { ResponseSubscriptionDto } from './dto/response-subscription.dto';
import { SubscriptionPlan } from './enum/subscription-plan.enum';
import { SubscriptionRenewalType } from './enum/subscription-renewal-type.enum';
import { SubscriptionQueueService } from './subscription.queue.service';
import {
  AUTO_RENEWAL_GRACE_PERIOD_MS,
  PAYMENT_REMINDER_BEFORE_END_MS,
} from './subscription.constant';
import { SubscriptionNotFoundException } from './exceptions/subscription-not-found.exception';
import { MailService } from 'src/mail/mail.service';
import { PaymentService } from 'src/payments/payments.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,

    @Inject(forwardRef(() => RestaurantsService))
    private readonly restaurantsService: RestaurantsService,

    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,

    private readonly subscriptionQueueService: SubscriptionQueueService,
    private readonly mailService: MailService,
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

  private async findByIdOrThrow(
    id: number,
    relations?: FindOptionsRelations<Subscription>,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id },
      ...(relations && { relations }),
    });

    if (!subscription) {
      throw new SubscriptionNotFoundException(id);
    }

    return subscription;
  }

  private computeEndDate(
    startDate: Date,
    plan: SubscriptionPlan,
    testDurationMinutes: number,
  ): Date {
    const endDate = new Date(startDate);

    switch (plan) {
      case SubscriptionPlan.TEST:
        endDate.setMinutes(endDate.getMinutes() + testDurationMinutes);
        break;

      case SubscriptionPlan.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }

    return endDate;
  }

  async create(restaurantId: number, plan: SubscriptionPlan) {
    const restaurant =
      await this.restaurantsService.findOneEntity(restaurantId);

    return this.createForRestaurant(restaurant, plan);
  }

  async createForRestaurant(
    restaurant: Restaurant,
    plan: SubscriptionPlan,
    renewalType?: SubscriptionRenewalType,
    manager?: EntityManager,
  ) {
    const startDate = new Date();
    const endDate = this.computeEndDate(startDate, plan, 3);

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

  private getPaymentReminderDelay(subscription: Subscription): number {
    const reminderTime =
      subscription.endDate.getTime() - PAYMENT_REMINDER_BEFORE_END_MS;
    return reminderTime - Date.now();
  }

  private async schedulePaymentReminderIfNeeded(subscription: Subscription) {
    if (subscription.renewalType !== SubscriptionRenewalType.AUTO) {
      return;
    }

    const delay = this.getPaymentReminderDelay(subscription);

    if (delay > 0) {
      await this.subscriptionQueueService.schedulePaymentReminder(
        subscription.id,
        delay,
      );
    }
  }

  // Persists an active subscription, marks its restaurant active and
  // (re)schedules every time-based job tied to the new period.
  private async saveActiveSubscription(
    subscription: Subscription,
  ): Promise<Subscription> {
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.restaurant.isActive = true;

    await this.restaurantsService.setActive(subscription.restaurant.id, true);

    const savedSubscription = await this.subscriptionRepo.save(subscription);
    const delay = this.getExpirationDelay(savedSubscription);

    if (delay > 0) {
      await this.subscriptionQueueService.rescheduleExpiration(
        savedSubscription.id,
        delay,
      );
    }

    await this.scheduleRenewalIfNeeded(savedSubscription);
    await this.schedulePaymentReminderIfNeeded(savedSubscription);

    return savedSubscription;
  }

  async activeSubscription(subscriptionId: number, stripePeriodEnd?: Date) {
    const subscription = await this.findByIdOrThrow(subscriptionId, {
      restaurant: true,
    });

    if (this.usesStripeSchedule(subscription) && stripePeriodEnd) {
      subscription.endDate = stripePeriodEnd;
    }

    return this.saveActiveSubscription(subscription);
  }

  async expireSubscription(subscriptionId: number) {
    const subscription = await this.findByIdOrThrow(subscriptionId, {
      restaurant: true,
    });

    await this.subscriptionQueueService.cancelRenewal(subscription.id);
    await this.subscriptionQueueService.cancelPaymentReminder(subscription.id);

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return subscription;
    }

    subscription.status = SubscriptionStatus.EXPIRED;
    subscription.restaurant.isActive = false;

    await this.restaurantsService.setActive(subscription.restaurant.id, false);
    return this.subscriptionRepo.save(subscription);
  }

  async checkoutExpired(subscriptionId: number) {
    const subscription = await this.findByIdOrThrow(subscriptionId);

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
    const subscription = await this.findByIdOrThrow(subscriptionId);

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

  async findByStripeSubscriptionIdOrThrow(
    stripeSubscriptionId: string,
  ): Promise<Subscription> {
    const subscription =
      await this.findByStripeSubscriptionId(stripeSubscriptionId);

    if (!subscription) {
      throw new SubscriptionNotFoundException();
    }

    return subscription;
  }

  async findById(subscriptionId: number): Promise<Subscription> {
    return this.findByIdOrThrow(subscriptionId, { restaurant: true });
  }

  async startCheckout(subscriptionId: number): Promise<Subscription> {
    const subscription = await this.findByIdOrThrow(subscriptionId, {
      restaurant: { owner: true },
    });

    if (
      subscription.status === SubscriptionStatus.CHECKOUT ||
      subscription.status === SubscriptionStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Subscription is already in checkout or active',
      );
    }

    subscription.status = SubscriptionStatus.CHECKOUT;

    return this.subscriptionRepo.save(subscription);
  }

  async renewSubscription(subscriptionId: number, stripePeriodEnd?: Date) {
    const subscription = await this.findByIdOrThrow(subscriptionId, {
      restaurant: true,
    });

    const startDate = new Date();
    let endDate = this.computeEndDate(startDate, subscription.plan, 2);

    if (this.usesStripeSchedule(subscription) && stripePeriodEnd) {
      endDate = stripePeriodEnd;
    }

    subscription.startDate = startDate;
    subscription.endDate = endDate;

    return this.saveActiveSubscription(subscription);
  }

  async sendPaymentReminder(subscriptionId: number): Promise<void> {
    const payment =
      await this.paymentService.findLatestSuccessfulPaymentBySubscriptionId(
        subscriptionId,
      );

    if (!payment) {
      return;
    }

    const subscription = payment.subscription;

    // If the subscription should no longer automatically renew,
    // there is no need to send an email.
    if (subscription.renewalType === SubscriptionRenewalType.MANUAL) {
      return;
    }

    // The payment query loads restaurant.owner on the payment itself,
    // not on payment.subscription.
    const restaurant = payment.restaurant;
    const owner = restaurant?.owner;

    if (!restaurant || !owner?.email) {
      return;
    }

    await this.mailService.sendSubscriptionPaymentReminderEmail({
      email: owner.email,
      customerName: owner.name,
      restaurantName: restaurant.name,
      amount: payment.amount,
      currency: payment.currency,
      billingDate: subscription.endDate,
    });
  }
}
