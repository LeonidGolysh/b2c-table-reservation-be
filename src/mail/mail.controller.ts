import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { SubscriptionPaymentEmailDto } from './dto/subscription-payment-email.dto';
import { SubscriptionPaymentReminderEmailDto } from './dto/subscripiton-payment-reminder-email.dto';
import { ReservationEmailDto } from './dto/reservation-email.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Email notifications')
@Controller('emails')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async findAll() {
    return await this.mailService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mailService.findOne(id);
  }

  @Post('subscription-payment')
  async sendSubscriptionPayment(@Body() dto: SubscriptionPaymentEmailDto) {
    await this.mailService.sendSubscriptionPaymentEmail({
      ...dto,
      billingDate: new Date(dto.billingDate),
      subscriptionEndDate: new Date(dto.subscriptionEndDate),
    });

    return {
      message: 'Subscription payment email sent',
    };
  }

  @Post('subscription-payment-reminder')
  async sendSubscriptionPaymentReminder(
    @Body() dto: SubscriptionPaymentReminderEmailDto,
  ) {
    await this.mailService.sendSubscriptionPaymentReminderEmail({
      ...dto,
      billingDate: new Date(dto.billingDate),
    });

    return {
      message: 'Subscription payment reminder sent',
    };
  }

  @Post('table-reservation')
  async sendReservationTableEmail(@Body() dto: ReservationEmailDto) {
    const checkInUrl =
      `${this.configService.getOrThrow<string>('FRONTEND_URL')}` +
      `/staff/check-in?token=test-token`;

    await this.mailService.sendReservationDetailsEmail({
      ...dto,
      startTime: new Date(dto.startTime),
      checkInUrl,
    });

    return {
      message: 'Table reservation email sent',
    };
  }
}
