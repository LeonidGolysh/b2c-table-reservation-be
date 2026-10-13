import { RenderedEmail } from '../interface/rendered-email.interface';
import { ReservationEmail } from '../interface/reservation-email.interface';
import { renderEmail } from './base-email.template';
import { formatDate } from './email-format.util';

export type ReservationEmailParams = Omit<ReservationEmail, 'email'>;

export function reservationEmailTemplate(
  params: ReservationEmailParams,
): RenderedEmail {
  const {
    reservationId,
    restaurantName,
    customerName,
    customerPhone,
    startTime,
    guestsCount,
  } = params;
  return renderEmail({
    subject: 'Table reservation',
    heading: 'Table reservation',
    customerName,
    intro: 'We have received your reservation request. Here are the details:',
    details: [
      {
        label: 'Restaurant',
        value: restaurantName,
      },
      {
        label: 'Reservation number',
        value: String(reservationId),
      },
      {
        label: 'Date and time',
        value: formatDate(startTime),
      },
      {
        label: 'Number of guests',
        value: String(guestsCount),
      },
      ...(customerPhone ? [{ label: 'Phone', value: customerPhone }] : []),
    ],
    outro: 'We look forward to welcoming you!',
  });
}
