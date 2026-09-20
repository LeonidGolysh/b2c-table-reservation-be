export interface SubscriptionPaymentEmail {
  email: string;
  customerName: string;
  restaurantName: string;
  amount: number;
  currency: string;
  subscriptionEndDate: Date;
  stripePaymentId?: string | null;
}
