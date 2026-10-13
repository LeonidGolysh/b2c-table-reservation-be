import { RenderedEmail } from '../interface/rendered-email.interface';
import { escapeHtml } from './email-format.util';

export interface EmailDetail {
  label: string;
  value: string;
}

export interface EmailContent {
  subject: string;
  heading: string;
  customerName?: string;
  intro: string;
  details: EmailDetail[];
  outro?: string;
  qrCodeCid?: string;
  fallbackUrl?: string;
}

// Shared layout for all outgoing emails: greeting, intro, a list of details,
// an optional closing paragraph and a sign-off. Renders both text and HTML
// from the same content so the two versions can't drift apart.
export function renderEmail(content: EmailContent): RenderedEmail {
  const { subject, heading, customerName, intro, details, outro } = content;

  const greeting = `Hello${customerName ? ` ${customerName}` : ''},`;
  const signOff = 'Thank you.';

  const text = [
    greeting,
    '',
    intro,
    '',
    ...details.map(({ label, value }) => `${label}: ${value}`),
    ...(outro ? ['', outro] : []),
    ...(content.fallbackUrl
      ? ['', 'Check-in link: ', content.fallbackUrl]
      : []),
    '',
    signOff,
  ].join('\n');

  const detailItems = details
    .map(
      ({ label, value }) =>
        `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`,
    )
    .join('\n          ');

  const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${escapeHtml(heading)}</h2>

        <p>${escapeHtml(greeting)}</p>

        <p>${escapeHtml(intro)}</p>

        <ul>
          ${detailItems}
        </ul>

        ${outro ? `<p>${escapeHtml(outro)}</p>\n\n        ` : ''}<p>${signOff}</p>

        ${
          content.qrCodeCid
            ? `
          <div style="text-align:center;margin-top:24px">
            <p>Show this QR code to the restaurant staff.</p>
            <img
              src="cid:${escapeHtml(content.qrCodeCid)}"
              alt="Reservation QR code"
              width="240"
              height="240"
            />
          </div>
        `
            : ''
        }
      </div>
    `.trim();

  return { subject, text, html };
}
