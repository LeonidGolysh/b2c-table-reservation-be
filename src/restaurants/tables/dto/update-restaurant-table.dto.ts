import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateRestaurantTableDto } from './create-restaurant-table.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateRestaurantTableDto extends PartialType(
  CreateRestaurantTableDto,
) {
  @ApiProperty({
    description: 'Whether table is available to use',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
