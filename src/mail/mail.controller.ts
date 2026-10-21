import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { SubscriptionPaymentEmailDto } from './dto/subscription-payment-email.dto';
import { SubscriptionPaymentReminderEmailDto } from './dto/subscription-payment-reminder-email.dto';
import { ReservationEmailDto } from './dto/reservation-email.dto';
import { ConfigService } from '@nestjs/config';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import { ApiPaginatedResponse } from 'src/common/decorator/api-paginated-response.decorator';
import { EmailResponseDto } from './dto/email-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@ApiTags('Email notifications')
@Controller('emails')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  @ApiPaginatedResponse(EmailResponseDto)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<EmailResponseDto>> {
    return await this.mailService.findAll(query);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EmailResponseDto> {
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
