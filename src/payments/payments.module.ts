import { Module } from '@nestjs/common';
import { PaymentService } from './payments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), SubscriptionsModule],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
