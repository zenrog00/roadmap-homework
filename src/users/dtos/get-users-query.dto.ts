import { IntersectionType, PickType, PartialType } from '@nestjs/mapped-types';
import { CursorPaginationDto } from 'src/common/dtos';
import { UserDto } from './user.dto';

export class GetUsersQueryDto extends IntersectionType(
  PartialType(PickType(UserDto, ['username'] as const)),
  CursorPaginationDto,
) {}
