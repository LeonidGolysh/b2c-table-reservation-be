import { Module } from '@nestjs/common';
import { Restaurant } from './entity/restaurant.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantAddresses } from './entity/restaurant-addresses.entity';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { User } from 'src/users/user.entity';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { Subscription } from 'src/subscriptions/subscription.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      RestaurantAddresses,
      User,
      Subscription,
    ]),
    SubscriptionsModule,
    StripeModule,
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
