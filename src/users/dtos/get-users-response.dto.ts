import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class GetUsersResponseDto {
  data: UserResponseDto[];
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'id of last returned user if next page exists',
  })
  nextCursor?: string;
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'id of first returned user is previous page exists',
  })
  prevCursor?: string;
}
