import { ApiProperty } from '@nestjs/swagger';

export class AvatarsListResponseDto {
  @ApiProperty({ format: 'uuid', description: 'UUID of avatar' })
  id: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: `Avatar's creation datetime`,
  })
  createdAt: Date;
}
