import { IntersectionType, PickType, PartialType } from '@nestjs/swagger';
import { CursorPaginationQueryDto } from 'src/common/dtos';
import { UserDto } from './user.dto';

export class GetUsersQueryDto extends IntersectionType(
  PartialType(PickType(UserDto, ['username'] as const)),
  CursorPaginationQueryDto,
) {}
