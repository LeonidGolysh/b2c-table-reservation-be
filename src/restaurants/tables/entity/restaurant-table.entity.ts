import { Restaurant } from '../../../restaurants/entity/restaurant.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RestaurantTableStatus } from '../enum/restaurant-table-status.enum';
import { ReservationTable } from '../../../restaurants/reservations/entity/reservation-table.entity';

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

  @Column({
    type: 'enum',
    enum: RestaurantTableStatus,
    default: RestaurantTableStatus.FREE,
  })
  status: RestaurantTableStatus;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @OneToMany(
    () => ReservationTable,
    (reservationTable) => reservationTable.restaurantTable,
  )
  reservationTables: ReservationTable[];
}
