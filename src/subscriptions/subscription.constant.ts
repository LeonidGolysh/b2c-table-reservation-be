import { SubscriptionPlan } from './enum/subscription-plan.enum';

export const SUBSCRIPTION_QUEUE = 'subscription-queue';

// Extra time added before hard-expiring an auto-renewing subscription, so
// Stripe's `invoice.payment_succeeded` webhook has a chance to arrive and
// renew it before the local expiration job runs at the exact period end.
export const AUTO_RENEWAL_GRACE_PERIOD_MS: Partial<
  Record<SubscriptionPlan, number>
> = {
  [SubscriptionPlan.TEST]: 30 * 1000, // 30s
  [SubscriptionPlan.MONTHLY]: 24 * 60 * 60 * 1000, // 24h
};
