import { Controller, Get, Post, Req, Headers } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @ApiOperation({
    summary: 'Test stripe',
  })
  @Get('test')
  test() {
    return this.stripeService.testConnection();
  }

  @Post('webhook')
  async webhook(
    @Req() req: Request<any, any, Buffer>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhook(req.body, signature);
  }
}
