import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  Headers,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
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
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // Stripe verifies the signature against the exact bytes it sent, so use
    // the raw body Nest keeps (rawBody: true in main.ts), not the parsed JSON.
    if (!req.rawBody) {
      throw new BadRequestException('Missing request body');
    }

    return this.stripeService.handleWebhook(req.rawBody, signature);
  }
}
