import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../entity/restaurant.entity';
import { Reservation } from './entity/reservation.entity';
import { RestaurantTable } from '../tables/entity/restaurant-table.entity';
import { ReservationTable } from './entity/reservation-table.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      RestaurantTable,
      Reservation,
      ReservationTable,
    ]),
    MailModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
