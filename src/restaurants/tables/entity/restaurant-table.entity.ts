import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('restaurant_tables')
export class RestaurantTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'table_number', type: 'int' })
  tableNumber: number;

  @Column({ name: 'seat', type: 'int' })
  seat: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;
}
