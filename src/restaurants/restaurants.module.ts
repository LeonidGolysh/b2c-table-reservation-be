import { forwardRef, Module } from '@nestjs/common';
import { Restaurant } from './entity/restaurant.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantAddresses } from './entity/restaurant-addresses.entity';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { UsersModule } from 'src/users/users.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, RestaurantAddresses]),
    UsersModule,
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
