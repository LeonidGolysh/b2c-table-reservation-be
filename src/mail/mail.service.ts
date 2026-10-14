import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { RenderedEmail } from './interface/rendered-email.interface';
import { SubscriptionPaymentEmail } from './interface/subscription-payment-email.interface';
import { SubscriptionPaymentReminderEmail } from './interface/subscription-payment-reminder-email.interface';
import { subscriptionPaymentTemplate } from './templates/subscription-payment.template';
import { subscriptionPaymentReminderTemplate } from './templates/subscription-payment-reminder.template';
import { EmailType } from './enum/email-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Email } from './entity/email.entity';
import { Repository } from 'typeorm';
import { EmailStatus } from './enum/email-status.enum';
import { reservationEmailTemplate } from './templates/reservation-email.template';
import { ReservationEmail } from './interface/reservation-email.interface';
import * as QRCode from 'qrcode';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  getPaginationOptions,
  toPaginatedResponse,
} from 'src/common/utils/pagination.util';
import { EmailResponseDto } from './dto/email-response.dto';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private readonly transporter: Transporter;

  constructor(
    @InjectRepository(Email)
    private emailRepository: Repository<Email>,
  ) {
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

  private mapToResponse(email: Email): EmailResponseDto {
    return {
      id: email.id,
      recipientEmail: email.recipientEmail,
      type: email.type,
      status: email.status,
      providerMessageId: email.providerMessageId,
      createdAt: email.createdAt,
      updatedAt: email.updatedAt,
    };
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('Gmail SMTP connection verified');
    } catch (error) {
      this.logger.error('Gmail SMTP connection failed', error);
    }
  }

  private async send(
    to: string,
    email: RenderedEmail,
    type: EmailType,
  ): Promise<void> {
    const emailLog = this.emailRepository.create({
      recipientEmail: to,
      type,
      status: EmailStatus.SENDING,
    });

    await this.emailRepository.save(emailLog);

    try {
      const result = await this.transporter.sendMail({
        from: this.from,
        to,
        ...email,
      });

      emailLog.status = EmailStatus.SENT;
      emailLog.providerMessageId = result.messageId;

      await this.emailRepository.save(emailLog);

      this.logger.log(`Email "${email.subject}" sent to ${to}`);
    } catch (error) {
      emailLog.status = EmailStatus.FAILED;

      await this.emailRepository.save(emailLog);

      this.logger.error(
        `Failed to send email "${email.subject}" to ${to}`,
        error,
      );

      throw error;
    }
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<EmailResponseDto>> {
    const [emails, total] = await this.emailRepository.findAndCount({
      ...getPaginationOptions(query),
      order: {
        createdAt: 'DESC',
      },
    });
    return toPaginatedResponse(
      emails.map((email) => this.mapToResponse(email)),
      total,
      query,
    );
  }

  async findOne(id: number): Promise<EmailResponseDto> {
    const email = await this.emailRepository.findOne({
      where: { id },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    return this.mapToResponse(email);
  }

  async sendSubscriptionPaymentEmail({
    email,
    ...content
  }: SubscriptionPaymentEmail): Promise<void> {
    await this.send(
      email,
      subscriptionPaymentTemplate(content),
      EmailType.PAYMENT_CONFIRMATION,
    );
  }

  async sendSubscriptionPaymentReminderEmail({
    email,
    ...content
  }: SubscriptionPaymentReminderEmail): Promise<void> {
    await this.send(
      email,
      subscriptionPaymentReminderTemplate(content),
      EmailType.PAYMENT_REMINDER,
    );
  }

  async sendReservationDetailsEmail({
    email,
    ...content
  }: ReservationEmail): Promise<void> {
    const qrCode = await QRCode.toBuffer(content.checkInUrl, {
      type: 'png',
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    await this.send(
      email,
      reservationEmailTemplate({ ...content, qrCode }),
      EmailType.RESERVATION,
    );
  }
}
