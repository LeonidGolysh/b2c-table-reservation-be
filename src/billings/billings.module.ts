import { Module } from '@nestjs/common';
import { BillingsController } from './billings.controller';
import { BillingsService } from './billings.service';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { PaymentModule } from 'src/payments/payments.module';

@Module({
  imports: [RestaurantsModule, PaymentModule],
  controllers: [BillingsController],
  providers: [BillingsService],
  exports: [BillingsService],
})
export class BillingsModule {}
