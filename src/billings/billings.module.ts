import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { BillingsController } from './billings.controller';
import { BillingsService } from './billings.service';
import { Payment } from 'src/payments/payment.entity';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Payment]), RestaurantsModule],
  controllers: [BillingsController],
  providers: [BillingsService],
  exports: [BillingsService],
})
export class BillingsModule {}
