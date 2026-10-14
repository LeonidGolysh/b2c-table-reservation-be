import { Module } from '@nestjs/common';
import { BillingsController } from './billings.controller';
import { BillingsService } from './billings.service';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { PaymentModule } from 'src/payments/payments.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    RestaurantsModule,
    PaymentModule,
    SubscriptionsModule,
    StripeModule,
  ],
  controllers: [BillingsController],
  providers: [BillingsService],
  exports: [BillingsService],
})
export class BillingsModule {}
