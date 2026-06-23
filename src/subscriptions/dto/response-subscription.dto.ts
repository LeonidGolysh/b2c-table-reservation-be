import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionRenewalType } from '../enum/subscription-renewal-type.enum';

export class ResponseSubscriptionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ enum: SubscriptionRenewalType })
  renewalType: SubscriptionRenewalType;
}
