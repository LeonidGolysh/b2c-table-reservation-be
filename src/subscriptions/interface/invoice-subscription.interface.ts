export type InvoiceWithSubscription = {
  parent?: {
    subscription_details?: {
      subscription?: string;
    };
  };
} & Record<string, any>;
