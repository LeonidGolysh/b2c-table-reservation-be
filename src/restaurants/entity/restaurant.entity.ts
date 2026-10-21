import { Worker } from '../../workers/worker.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RestaurantAddresses } from './restaurant-addresses.entity';
import { Review } from '../../reviews/review.entity';
import { Subscription } from '../../subscriptions/subscription.entity';
import { Payment } from '../../payments/payment.entity';
import { RestaurantTable } from '../tables/entity/restaurant-table.entity';
import { OnboardingStatus } from '../enum/onboarding-status.enum';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Worker, (worker) => worker.ownedRestaurants)
  @JoinColumn({ name: 'owner_id' })
  owner: Worker;

  // Managers and staff. The owner is not listed here, see `owner`.
  @OneToMany(() => Worker, (worker) => worker.restaurant)
  employees: Worker[];

  @OneToMany(() => RestaurantAddresses, (address) => address.restaurant)
  addresses: RestaurantAddresses[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Review, (review) => review.restaurant)
  reviews: Review[];

  @Column({ type: 'float', default: 0 })
  avgRating: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @OneToOne(() => Subscription, (s) => s.restaurant)
  subscriptions: Subscription;

  @Column({ default: false })
  isActive: boolean;

  @OneToMany(() => Payment, (payment) => payment.restaurant)
  payments: Payment[];

  @OneToMany(() => RestaurantTable, (table) => table.restaurant)
  tables: RestaurantTable[];

  @Column({
    type: 'enum',
    enum: OnboardingStatus,
    default: OnboardingStatus.IN_PROGRESS,
    name: 'onboarding_status',
  })
  onboardingStatus: OnboardingStatus;
}
