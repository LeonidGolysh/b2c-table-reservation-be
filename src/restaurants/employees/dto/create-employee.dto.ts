import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { CreateWorkerDto } from 'src/workers/dto/create-worker.dto';
import {
  EMPLOYEE_ROLES,
  type EmployeeRole,
  WorkerRole,
} from 'src/workers/enum/worker-role.enum';

export class CreateEmployeeDto extends CreateWorkerDto {
  @ApiProperty({ enum: EMPLOYEE_ROLES, example: WorkerRole.STAFF })
  @IsIn(EMPLOYEE_ROLES)
  role: EmployeeRole;
}
