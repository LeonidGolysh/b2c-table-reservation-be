import { RenderedEmail } from '../interface/rendered-email.interface';
import { SubscriptionPaymentEmail } from '../interface/subscription-payment-email.interface';
import { renderEmail } from './base-email.template';
import { formatAmount, formatDate } from './email-format.util';

export type SubscriptionPaymentTemplateParams = Omit<
  SubscriptionPaymentEmail,
  'email'
>;

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

  return renderEmail({
    subject: 'Subscription payment confirmed',
    heading: 'Payment confirmed',
    customerName,
    intro: 'Your subscription payment has been successfully completed.',
    details: [
      { label: 'Restaurant', value: restaurantName },
      { label: 'Amount', value: formatAmount(amount, currency) },
      { label: 'Valid until', value: formatDate(subscriptionEndDate) },
      ...(stripePaymentId
        ? [{ label: 'Payment ID', value: stripePaymentId }]
        : []),
    ],
  });
}
