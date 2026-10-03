export interface SubscriptionPaymentReminderEmail {
  email: string;
  customerName: string;
  restaurantName: string;
  amount: number;
  currency: string;
  billingDate: Date;
}
