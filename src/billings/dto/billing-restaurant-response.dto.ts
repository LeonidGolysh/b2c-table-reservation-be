import { ApiProperty } from '@nestjs/swagger';
import { BillingSubscriptionResponseDto } from './billing-subscription-response.dto';

export class BillingRestaurantResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Restaurant ID',
  })
  id: number;

  @ApiProperty({
    example: 'My restaurant',
    description: 'Restaurant name',
  })
  name: string;

  @ApiProperty({
    example: true,
    description: 'Whether restaurant is active',
  })
  isActive: boolean;

  @ApiProperty({
    type: BillingSubscriptionResponseDto,
    nullable: true,
    description: 'Restaurant subscription',
  })
  subscription: BillingSubscriptionResponseDto | null;
}
