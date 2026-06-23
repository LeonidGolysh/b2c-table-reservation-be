import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SubscriptionRenewalType } from 'src/subscriptions/enum/subscription-renewal-type.enum';

export class CreateCheckoutDto {
  @ApiProperty({
    enum: SubscriptionRenewalType,
    example: SubscriptionRenewalType.MANUAL,
  })
  @IsEnum(SubscriptionRenewalType)
  renewalType: SubscriptionRenewalType;
}
