import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';
import { CursorPaginationResponseDto } from 'src/common/dtos';

class GetUsersDataDto {
  @ApiProperty({ type: UserResponseDto, isArray: true })
  data: UserResponseDto[];
}

export class GetUsersResponseDto extends IntersectionType(
  GetUsersDataDto,
  CursorPaginationResponseDto,
) {}
