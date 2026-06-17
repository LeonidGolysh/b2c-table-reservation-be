import { ApiProperty } from '@nestjs/swagger';

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
}
