import { Module } from '@nestjs/common';
import { RestaurantsModule } from '../restaurants.module';
import { WorkersModule } from 'src/workers/workers.module';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  imports: [RestaurantsModule, WorkersModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
