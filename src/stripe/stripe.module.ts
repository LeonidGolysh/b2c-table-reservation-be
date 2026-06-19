import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { Subscription } from 'src/subscriptions/subscription.entity';
import { StripeEvent } from './stripe-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StripeEvent, Subscription]),
    SubscriptionsModule,
  ],
  providers: [StripeService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
