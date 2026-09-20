import { RenderedEmail } from '../interface/rendered-email.interface';
import { SubscriptionPaymentEmail } from '../interface/subscription-payment-email.interface';
import { EMAIL_LOCALE, ZERO_DECIMAL_CURRENCIES } from '../mail.constant';

export type SubscriptionPaymentTemplateParams = Omit<
  SubscriptionPaymentEmail,
  'email'
>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAmount(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const divisor = ZERO_DECIMAL_CURRENCIES.has(code) ? 1 : 100;

  return new Intl.NumberFormat(EMAIL_LOCALE, {
    style: 'currency',
    currency: code,
  }).format(amount / divisor);
}

export function subscriptionPaymentTemplate(
  params: SubscriptionPaymentTemplateParams,
): RenderedEmail {
  const {
    customerName,
    restaurantName,
    amount,
    currency,
    subscriptionEndDate,
    stripePaymentId,
  } = params;

  const formattedAmount = formatAmount(amount, currency);
  const formattedEndDate = new Intl.DateTimeFormat(EMAIL_LOCALE, {
    dateStyle: 'long',
  }).format(subscriptionEndDate);

  const greeting = `Hello${customerName ? ` ${customerName}` : ''},`;

  const textLines = [
    greeting,
    '',
    'Your subscription payment has been successfully completed.',
    '',
    `Restaurant: ${restaurantName}`,
    `Amount: ${formattedAmount}`,
    `Subscription valid until: ${formattedEndDate}`,
  ];

  if (stripePaymentId) {
    textLines.push(`Payment ID: ${stripePaymentId}`);
  }

  textLines.push('', 'Thank you.');

  return {
    subject: 'Subscription payment confirmed',

    text: textLines.join('\n'),

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Payment confirmed</h2>

        <p>${escapeHtml(greeting)}</p>

        <p>
          Your subscription payment has been successfully completed.
        </p>

        <ul>
          <li>
            <strong>Restaurant:</strong>
            ${escapeHtml(restaurantName)}
          </li>

          <li>
            <strong>Amount:</strong>
            ${formattedAmount}
          </li>

          <li>
            <strong>Valid until:</strong>
            ${formattedEndDate}
          </li>

          ${
            stripePaymentId
              ? `
                <li>
                  <strong>Payment ID:</strong>
                  ${escapeHtml(stripePaymentId)}
                </li>
              `
              : ''
          }
        </ul>

        <p>Thank you.</p>
      </div>
    `.trim(),
  };
}
