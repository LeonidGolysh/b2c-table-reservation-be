import { ApiProperty } from '@nestjs/swagger';
import { WorkerRole } from '../enum/worker-role.enum';

export class ResponseWorkerDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Anna' })
  name: string;

  @ApiProperty({ example: 'Smith' })
  lastname: string;

  @ApiProperty({ example: '1234567890' })
  phoneNumber: string;

  @ApiProperty({ example: 'test@gmail.com' })
  email: string;

  @ApiProperty({ enum: WorkerRole, example: WorkerRole.OWNER })
  role: WorkerRole;

  @ApiProperty({ example: null, nullable: true, type: Number })
  restaurantId: number | null;
}
