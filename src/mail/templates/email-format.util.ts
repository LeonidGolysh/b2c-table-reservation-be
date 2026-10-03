import { EMAIL_LOCALE, ZERO_DECIMAL_CURRENCIES } from '../mail.constant';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Stripe amounts are in minor units (e.g. cents) except for zero-decimal currencies.
export function formatAmount(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const divisor = ZERO_DECIMAL_CURRENCIES.has(code) ? 1 : 100;

  return new Intl.NumberFormat(EMAIL_LOCALE, {
    style: 'currency',
    currency: code,
  }).format(amount / divisor);
}

export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'long' },
): string {
  return new Intl.DateTimeFormat(EMAIL_LOCALE, options).format(date);
}
