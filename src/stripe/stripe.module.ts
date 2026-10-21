import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { StripeEvent } from './stripe-event.entity';
import { PaymentsModule } from 'src/payments/payments.module';
import { MailModule } from 'src/mail/mail.module';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StripeEvent]),
    MailModule,
    SubscriptionsModule,
    PaymentsModule,
    RestaurantsModule,
  ],
  providers: [StripeService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
