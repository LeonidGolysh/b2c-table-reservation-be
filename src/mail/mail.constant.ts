export const MAIL_QUEUE = 'mail';

// Locale used to format amounts and dates in outgoing emails.
export const EMAIL_LOCALE = 'en-US';

// Currencies Stripe reports in whole units rather than in minor units.
export const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);
