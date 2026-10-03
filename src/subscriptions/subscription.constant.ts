import { SubscriptionPlan } from './enum/subscription-plan.enum';

export const SUBSCRIPTION_QUEUE = 'subscription-queue';

export const SUBSCRIPTION_JOBS = {
  EXPIRE: 'expire-subscription',
  RENEW: 'renew-subscription',
  PAYMENT_REMINDER: 'payment-reminder',
} as const;

export type SubscriptionJobName =
  (typeof SUBSCRIPTION_JOBS)[keyof typeof SUBSCRIPTION_JOBS];

// How long before the period ends the auto-renewal reminder email is sent.
export const PAYMENT_REMINDER_BEFORE_END_MS = 24 * 60 * 60 * 1000; // 24h

// Extra time added before hard-expiring an auto-renewing subscription, so
// Stripe's `invoice.payment_succeeded` webhook has a chance to arrive and
// renew it before the local expiration job runs at the exact period end.
export const AUTO_RENEWAL_GRACE_PERIOD_MS: Partial<
  Record<SubscriptionPlan, number>
> = {
  [SubscriptionPlan.TEST]: 30 * 1000, // 30s
  [SubscriptionPlan.MONTHLY]: 24 * 60 * 60 * 1000, // 24h
};
