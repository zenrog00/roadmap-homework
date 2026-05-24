import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';
import { CursorPaginationResponseDto } from 'src/common/utils/cursor-pagination';

class GetUsersDataDto {
  @ApiProperty({
    type: UserResponseDto,
    isArray: true,
    description: `List of users' info`,
  })
  data: UserResponseDto[];
}

export class GetUsersResponseDto extends IntersectionType(
  GetUsersDataDto,
  CursorPaginationResponseDto,
) {}
