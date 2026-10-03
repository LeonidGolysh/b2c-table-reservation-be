import { SubscriptionEmail } from './subscription-email.interface';

export interface SubscriptionPaymentReminderEmail extends SubscriptionEmail {
  billingDate: Date;
}
