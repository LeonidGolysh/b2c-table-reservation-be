import { RenderedEmail } from '../interface/rendered-email.interface';
import { SubscriptionPaymentReminderEmail } from '../interface/subscription-payment-reminder-email.interface';
import { renderEmail } from './base-email.template';
import { formatAmount, formatDate } from './email-format.util';

export type SubscriptionPaymentReminderTemplateParams = Omit<
  SubscriptionPaymentReminderEmail,
  'email'
>;

export function subscriptionPaymentReminderTemplate(
  params: SubscriptionPaymentReminderTemplateParams,
): RenderedEmail {
  const { customerName, restaurantName, amount, currency, billingDate } =
    params;

  return renderEmail({
    subject: 'Your subscription will be renewed tomorrow',
    heading: 'Your subscription will be renewed tomorrow',
    customerName,
    intro:
      'This is a reminder that your subscription will be automatically renewed tomorrow.',
    details: [
      { label: 'Restaurant', value: restaurantName },
      { label: 'Amount', value: formatAmount(amount, currency) },
      {
        label: 'Payment date',
        value: formatDate(billingDate, {
          dateStyle: 'long',
          timeStyle: 'short',
        }),
      },
    ],
    outro:
      'The payment will be charged automatically using your saved payment method.',
  });
}
