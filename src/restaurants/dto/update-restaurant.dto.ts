import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
