// Fields shared by every subscription-related email.
export interface SubscriptionEmail {
  email: string;
  customerName?: string;
  restaurantName: string;
  amount: number;
  currency: string;
}
