import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { BullModule } from '@nestjs/bullmq';
import { SUBSCRIPTION_QUEUE } from './subscription.constant';
import { SubscriptionQueueService } from './subscription.queue.service';
import { SubscriptionProcessor } from './subscription.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Restaurant]),
    BullModule.registerQueue({
      name: SUBSCRIPTION_QUEUE,
    }),
  ],
  providers: [
    SubscriptionsService,
    SubscriptionQueueService,
    SubscriptionProcessor,
  ],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService, SubscriptionQueueService],
})
export class SubscriptionsModule {}
