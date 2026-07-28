import { forwardRef, Module } from '@nestjs/common';
import { Restaurant } from './entity/restaurant.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantAddresses } from './entity/restaurant-addresses.entity';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { UsersModule } from 'src/users/users.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { StripeModule } from 'src/stripe/stripe.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, RestaurantAddresses]),
    UsersModule,
    forwardRef(() => SubscriptionsModule),
    StripeModule,
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
