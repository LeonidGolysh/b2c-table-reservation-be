import { SubscriptionEmail } from './subscription-email.interface';

export interface SubscriptionPaymentEmail extends SubscriptionEmail {
  subscriptionEndDate: Date;
  stripePaymentId?: string | null;
  billingDate: Date;
}
