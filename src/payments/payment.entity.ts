import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { Subscription } from 'src/subscriptions/subscription.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from './payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.payments, {
    onDelete: 'CASCADE',
  })
  restaurant!: Restaurant;

  @ManyToOne(() => Subscription, (subscription) => subscription.payments, {
    onDelete: 'CASCADE',
  })
  subscription!: Subscription;

  @Column({ name: 'stripe_session_id', nullable: true, unique: true })
  stripeSessionId!: string;

  @Column({ name: 'stripe_payment_intent_id', nullable: true })
  stripePaymentIntentId!: string;

  @Column({ type: 'int', default: 0 })
  amount!: number;

  @Column({ default: 'usd' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
