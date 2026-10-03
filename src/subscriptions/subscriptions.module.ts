import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { BullModule } from '@nestjs/bullmq';
import { SUBSCRIPTION_QUEUE } from './subscription.constant';
import { SubscriptionQueueService } from './subscription.queue.service';
import { SubscriptionProcessor } from './subscription.processor';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { PaymentModule } from 'src/payments/payments.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    forwardRef(() => RestaurantsModule),
    forwardRef(() => PaymentModule),
    MailModule,
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
