import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { RenderedEmail } from './interface/rendered-email.interface';
import { SubscriptionPaymentEmail } from './interface/subscription-payment-email.interface';
import { SubscriptionPaymentReminderEmail } from './interface/subscription-payment-reminder-email.interface';
import { subscriptionPaymentTemplate } from './templates/subscription-payment.template';
import { subscriptionPaymentReminderTemplate } from './templates/subscription-payment-reminder.template';

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

  private async send(to: string, email: RenderedEmail): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to, ...email });

    this.logger.log(`Email "${email.subject}" sent to ${to}`);
  }

  async sendSubscriptionPaymentEmail({
    email,
    ...content
  }: SubscriptionPaymentEmail): Promise<void> {
    await this.send(email, subscriptionPaymentTemplate(content));
  }

  async sendSubscriptionPaymentReminderEmail({
    email,
    ...content
  }: SubscriptionPaymentReminderEmail): Promise<void> {
    await this.send(email, subscriptionPaymentReminderTemplate(content));
  }
}
