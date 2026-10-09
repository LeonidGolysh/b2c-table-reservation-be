import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantTable } from './entity/restaurant-table.entity';
import { RestaurantTablesController } from './restaurant-tables.controller';
import { RestaurantTablesService } from './restaurant-tables.service';
import { RestaurantsModule } from '../restaurants.module';

@Module({
  imports: [TypeOrmModule.forFeature([RestaurantTable]), RestaurantsModule],
  controllers: [RestaurantTablesController],
  providers: [RestaurantTablesService],
  exports: [RestaurantTablesService],
})
export class RestaurantTablesModule {}
