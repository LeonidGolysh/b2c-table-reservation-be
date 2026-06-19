import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('stripe-event')
export class StripeEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'stripe_event_id', unique: true })
  stripeEventId: string;

  @Column()
  type: string;

  @CreateDateColumn()
  createdAt: Date;
}
