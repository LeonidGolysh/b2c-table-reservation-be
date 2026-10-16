import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkerRole } from './enum/worker-role.enum';
import { Restaurant } from '../restaurants/entity/restaurant.entity';

// Admins and owners are not tied to one restaurant (owners link to their
// restaurants through restaurants.owner_id). Managers and staff always are.
@Entity('workers')
@Check(
  'CHK_workers_restaurant_by_role',
  `("role" IN ('ADM', 'OWN') AND "restaurant_id" IS NULL) OR ("role" IN ('MGR', 'STF') AND "restaurant_id" IS NOT NULL)`,
)
export class Worker {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50 })
  lastname: string;

  @Column({ length: 10 })
  phone_number: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: WorkerRole,
  })
  role: WorkerRole;

  @Column({ name: 'restaurant_id', type: 'int', nullable: true })
  restaurantId: number | null;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.employees, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant | null;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  ownedRestaurants: Restaurant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
