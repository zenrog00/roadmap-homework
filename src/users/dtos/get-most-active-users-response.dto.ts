import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';
import { CursorPaginationResponseDto } from 'src/common/utils/cursor-pagination';

class MostActiveUsersAvatarDto {
  @ApiProperty({
    description: `ID of user's last avatar`,
    type: String,
    format: 'uuid',
  })
  lastAvatarId: string;

  @ApiProperty({
    description: `Creation datetime of user's last avatar`,
    format: 'date-time',
  })
  lastAvatarCreatedAt: Date;
}

export class MostActiveUsersResponseDto extends IntersectionType(
  UserResponseDto,
  MostActiveUsersAvatarDto,
) {}

class MostActiveUsersDataDto {
  @ApiProperty({
    type: MostActiveUsersResponseDto,
    isArray: true,
    description: `List of most active users' info`,
  })
  data: MostActiveUsersResponseDto[];
}

export class GetMostActiveUsersResponseDto extends IntersectionType(
  MostActiveUsersDataDto,
  CursorPaginationResponseDto,
) {}
