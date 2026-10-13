import { RenderedEmail } from '../interface/rendered-email.interface';
import { ReservationEmail } from '../interface/reservation-email.interface';
import { renderEmail } from './base-email.template';
import { formatDate } from './email-format.util';

const QR_CODE_CID = 'reservation-qr';

export type ReservationEmailParams = Omit<ReservationEmail, 'email'> & {
  qrCode: Buffer;
};

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
    checkInUrl,
    qrCode,
  } = params;

  const email = renderEmail({
    subject: 'Table reservation',
    heading: 'Table reservation',
    customerName,
    intro: 'We have received your reservation request. Here are the details:',
    details: [
      { label: 'Restaurant', value: restaurantName },
      { label: 'Reservation number', value: String(reservationId) },
      {
        label: 'Date and time',
        value: formatDate(startTime, { dateStyle: 'long', timeStyle: 'short' }),
      },
      { label: 'Number of guests', value: String(guestsCount) },
      ...(customerPhone ? [{ label: 'Phone', value: customerPhone }] : []),
    ],
    outro: 'We look forward to welcoming you!',
    qrCodeCid: QR_CODE_CID,
    fallbackUrl: checkInUrl,
  });

  return {
    ...email,
    attachments: [
      {
        filename: 'reservation-qr.png',
        content: qrCode,
        contentType: 'image/png',
        cid: QR_CODE_CID,
      },
    ],
  };
}
