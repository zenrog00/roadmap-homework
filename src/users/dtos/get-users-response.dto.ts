import { UserDto } from './user.dto';

type UserResponseDto = Omit<UserDto, 'password'> & { id: string };

export interface GetUsersResponseDto {
  data: UserResponseDto[];
  nextCursor?: string;
  prevCursor?: string;
}
