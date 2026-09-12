import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from 'src/payments/payment-status.enum';

export class PaymentResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Payment ID',
  })
  id: number;

  @ApiProperty({
    example: 2,
    description: 'Subscription ID',
  })
  subscriptionId: number;

  @ApiProperty({
    example: 3,
    description: 'Restaurant ID',
  })
  restaurantId: number;

  @ApiProperty({
    example: 'cs_test_a1b2c3',
    nullable: true,
    description: 'Stripe Checkout session ID',
  })
  stripeSessionId: string | null;

  @ApiProperty({
    example: 'pi_3Nxxx',
    nullable: true,
    description: 'Stripe PaymentIntent ID',
  })
  stripePaymentIntentId: string | null;

  @ApiProperty({
    example: 'in_1Nxxx',
    nullable: true,
    description: 'Stripe invoice ID',
  })
  stripeInvoiceId: string | null;

  @ApiProperty({
    example: 'sub_1Nxxx',
    nullable: true,
    description: 'Stripe Subscription ID',
  })
  stripeSubscriptionId: string | null;

  @ApiProperty({
    example: 1000,
    description:
      'Payment amount in the smallest currency unit. For PLN means 10.00 PLN.',
  })
  amount: number;

  @ApiProperty({
    example: 'pln',
    description: 'Payment currency',
  })
  currency: string;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
    description: 'Payment status',
  })
  status: PaymentStatus;

  @ApiProperty({
    example: '2026-09-11T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;
}
