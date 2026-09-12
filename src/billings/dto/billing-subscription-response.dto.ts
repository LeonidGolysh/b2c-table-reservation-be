import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from 'src/subscriptions/enum/subscription-plan.enum';
import { SubscriptionRenewalType } from 'src/subscriptions/enum/subscription-renewal-type.enum';
import { SubscriptionStatus } from 'src/subscriptions/enum/subscription-status.enum';

export class BillingSubscriptionResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Subscription ID',
  })
  id: number;

  @ApiProperty({
    enum: SubscriptionPlan,
    example: SubscriptionPlan.MONTHLY,
    description: 'Subscription plan',
  })
  plan: SubscriptionPlan;

  @ApiProperty({
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
    description: 'Subscription status',
  })
  status: SubscriptionStatus;

  @ApiProperty({
    enum: SubscriptionRenewalType,
    example: SubscriptionRenewalType.AUTO,
    description: 'Subscription renewal type',
  })
  renewalType: SubscriptionRenewalType;

  @ApiProperty({
    example: '2026-09-01T00:00:00.000Z',
    description: 'Subscription start date',
    type: String,
    format: 'date-time',
  })
  startDate: Date;

  @ApiProperty({
    example: '2026-10-01T00:00:00.000Z',
    description: 'Subscription expiration date',
    type: String,
    format: 'date-time',
  })
  endDate: Date;

  @ApiProperty({
    example: 30,
    nullable: true,
    description: 'Number of days remaining until expiration',
  })
  daysRemaining: number | null;
}
