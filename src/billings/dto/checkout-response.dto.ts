import { ApiProperty } from '@nestjs/swagger';

export class CheckoutResponseDto {
  @ApiProperty({
    example: 'https://checkout.stripe.com/c/pay/cs_test_...',
    description: 'Stripe Checkout session URL',
  })
  checkoutUrl: string | null;
}
