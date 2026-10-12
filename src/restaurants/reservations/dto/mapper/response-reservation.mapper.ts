import { Reservation } from '../../entity/reservation.entity';
import { ResponseReservationDto } from '../response-reservation.dto';

export function toResponseReservationDto(
  reservation: Reservation,
): ResponseReservationDto {
  return {
    id: reservation.id,
    restaurantId: reservation.restaurant.id,
    customerName: reservation.customerName,
    customerEmail: reservation.customerEmail,
    customerPhone: reservation.customerPhone,
    guestsCount: reservation.guestsCount,
    startTime: reservation.startTime,
    durationMinutes: reservation.durationMinutes,
    bufferMinutes: reservation.bufferMinutes,
    status: reservation.status,
    createdAt: reservation.createdAt,
    tables: (reservation.reservationTables ?? []).map((rt) => ({
      id: rt.restaurantTable.id,
      tableNumber: rt.restaurantTable.tableNumber,
      seats: rt.restaurantTable.seat,
    })),
  };
}
