import { UserMyResponseDto, UserResponseDto } from '.';
import { User } from '../entities';

export function formatUserBirthdateAsDateOnly(
  value: Date | string | number,
): string {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'string') {
    return value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
  }

  return String(value);
}

export function toUserResponseDto(
  user: Pick<User, 'id' | 'username' | 'email' | 'birthdate' | 'description'>,
): UserResponseDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    birthdate: formatUserBirthdateAsDateOnly(user.birthdate),
    description: user.description,
  };
}

export function toUserMyResponseDto(user: User): UserMyResponseDto {
  return {
    ...toUserResponseDto(user),
    balance: user.balance,
  };
}
