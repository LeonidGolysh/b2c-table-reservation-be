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

@ApiTags('Email notifications')
@Controller('emails')
export class MailController {
  constructor(private readonly mailService: MailService) {}

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
}
