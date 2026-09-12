import { ApiProperty } from '@nestjs/swagger';
import { BillingRestaurantResponseDto } from './billing-restaurant-response.dto';
import { BillingSubscriptionResponseDto } from './billing-subscription-response.dto';

export class CurrentBillingResponseDto {
  @ApiProperty({
    type: BillingRestaurantResponseDto,
    description: 'Restaurant billing information',
  })
  restaurant: {
    id: number;
    name: string;
    isActive: boolean;
  };

  @ApiProperty({
    type: BillingSubscriptionResponseDto,
    description: 'Current restaurant subscription',
  })
  subscription: BillingSubscriptionResponseDto;
}
