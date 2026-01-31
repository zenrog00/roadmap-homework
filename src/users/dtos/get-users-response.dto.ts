import { UserDto } from './user.dto';

export type UserResponseDto = Omit<UserDto, 'password'> & { id: string };

export interface GetUsersResponseDto {
  data: UserResponseDto[];
  nextCursor?: string;
  prevCursor?: string;
}
