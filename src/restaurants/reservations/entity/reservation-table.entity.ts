import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Reservation } from './reservation.entity';
import { RestaurantTable } from '../../../restaurants/tables/entity/restaurant-table.entity';

@Entity('reservation_tables')
@Unique(['reservation', 'restaurantTable'])
export class ReservationTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Reservation,
    (reservation) => reservation.reservationTables,
    { onDelete: 'RESTRICT' },
  )
  reservation: Reservation;

  @ManyToOne(
    () => RestaurantTable,
    (restaurantTable) => restaurantTable.reservationTables,
    { onDelete: 'RESTRICT' },
  )
  restaurantTable: RestaurantTable;
}
