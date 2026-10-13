export interface ReservationEmail {
  email: string;
  reservationId: number;
  restaurantName: string;
  customerName: string;
  customerPhone?: string;
  startTime: Date;
  guestsCount: number;
}
