import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_addresses')
export class RestaurantAddresses {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'country', length: 50 })
  country: string;

  @Column({ name: 'city', length: 100 })
  city: string;

  @Column({ name: 'street', length: 255 })
  street: string;

  @Column({ name: 'building_number', length: 5 })
  buildingNumber: string;

  @Column({ name: 'postal_code', length: 5, nullable: true })
  postalCode?: string;

  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
