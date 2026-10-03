import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { SubscriptionPaymentEmail } from './interface/subscription-payment-email.interface';
import { subscriptionPaymentTemplate } from './templates/subscription-payment.template';
import { SubscriptionPaymentReminderEmail } from './interface/subscription-payment-reminder-email.interface';
import { subscriptionPaymentReminderTemplate } from './templates/susbcription-payment-reminder.template';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private readonly transporter: Transporter;

  constructor() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      throw new Error('EMAIL_USER and EMAIL_PASS must be set');
    }

    this.from = `"Restaurant Platform" <${user}>`;
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('Gmail SMTP connection verified');
    } catch (error) {
      this.logger.error('Gmail SMTP connection failed', error);
    }
  }

  async sendSubscriptionPaymentEmail(
    params: SubscriptionPaymentEmail,
  ): Promise<void> {
    const { email, ...content } = params;
    const { subject, text, html } = subscriptionPaymentTemplate(content);

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject,
      text,
      html,
    });

    this.logger.log(`Payment email sent to ${email}`);
  }

  async sendSubscriptionPaymentReminderEmail(
    params: SubscriptionPaymentReminderEmail,
  ): Promise<void> {
    const { email, ...content } = params;
    const { subject, text, html } =
      subscriptionPaymentReminderTemplate(content);

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject,
      text,
      html,
    });

    this.logger.log(`Reminder payment email send tp ${email}`);
  }
}
