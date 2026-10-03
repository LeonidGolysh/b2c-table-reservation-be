import { RenderedEmail } from '../interface/rendered-email.interface';
import { SubscriptionPaymentReminderEmail } from '../interface/subscription-payment-reminder-email.interface';
import { EMAIL_LOCALE, ZERO_DECIMAL_CURRENCIES } from '../mail.constant';

export type subscriptionPaymentReminderTemplateParams = Omit<
  SubscriptionPaymentReminderEmail,
  'email'
>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatAmount(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const divisor = ZERO_DECIMAL_CURRENCIES.has(code) ? 1 : 100;

  return new Intl.NumberFormat(EMAIL_LOCALE, {
    style: 'currency',
    currency: code,
  }).format(amount / divisor);
}

export function subscriptionPaymentReminderTemplate(
  params: subscriptionPaymentReminderTemplateParams,
): RenderedEmail {
  const { customerName, restaurantName, amount, currency, billingDate } =
    params;

  const formattedAmount = formatAmount(amount, currency);
  const formattedBillingDate = new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(billingDate);

  const greeting = `Hello ${customerName ? `${customerName}` : ' '},`;

  return {
    subject: 'Your subscription will be renewed tomorrow',
    text: [
      greeting,
      '',
      'This is a reminder that your subscription will be automatically renewed tomorrow',
      '',
      `Restaurant: ${restaurantName}`,
      `Amount: ${amount}`,
      `Payment date: ${formattedBillingDate}`,
      '',
      'The payment will be charged automatically using your saved payment method',
      '',
      'Thank you',
    ].join('\n'),

    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Your subscription will be renewed tomorrow</h2>

        <p>${escapeHtml(greeting)}</p>

        <p>
          This is a reminder that your subscription will be
          automatically renewed tomorrow.
        </p>

        <ul>
          <li>
            <strong>Restaurant:</strong>
            ${escapeHtml(restaurantName)}
          </li>

          <li>
            <strong>Amount:</strong>
            ${escapeHtml(formattedAmount)}
          </li>

          <li>
            <strong>Payment date:</strong>
            ${escapeHtml(formattedBillingDate)}
          </li>
        </ul>

        <p>
          The payment will be charged automatically using your
          saved payment method.
        </p>

        <p>Thank you.</p>
      </div>
    `.trim(),
  };
}
