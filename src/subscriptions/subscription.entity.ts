import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionStatus } from './enum/subscription-status.enum';
import { SubscriptionPlan } from './enum/subscription-plan.enum';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Restaurant, (r) => r.subscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  restaurant: Restaurant;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PEN,
  })
  status: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
  })
  plan: SubscriptionPlan;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
