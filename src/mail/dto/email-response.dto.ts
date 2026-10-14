import { ApiProperty } from '@nestjs/swagger';
import { EmailStatus } from '../enum/email-status.enum';
import { EmailType } from '../enum/email-type.enum';

export class EmailResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'johndoe@gmail.com' })
  recipientEmail: string;

  @ApiProperty({ enum: EmailType })
  type: EmailType;

  @ApiProperty({ enum: EmailStatus })
  status: EmailStatus;

  @ApiProperty({
    example: '<28894da4-3104-be90-5cfc-a3cf9965f104@gmail.com>',
    nullable: true,
  })
  providerMessageId: string | null;

  @ApiProperty({ example: '2026-10-13T13:12:28.797Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-13T13:12:31.295Z' })
  updatedAt: Date;
}
