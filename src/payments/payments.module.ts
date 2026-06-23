import { Module } from '@nestjs/common';
import { PaymentService } from './payments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/subscriptions/subscription.entity';
import { Payment } from './payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Subscription])],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
