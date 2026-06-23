import { User } from 'src/users/user.entity';
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
import { Review } from 'src/reviews/review.entity';
import { Subscription } from 'src/subscriptions/subscription.entity';
import { Payment } from 'src/payments/payment.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

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
}
