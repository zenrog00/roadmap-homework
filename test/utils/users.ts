import { UserDto } from 'src/users/dtos';

export function generateUserDto(): UserDto {
  return {
    username: `user_${Date.now()}`,
    email: `${Date.now()}@yahoo.com`,
    password: 'test_pass',
    birthdate: new Date(),
    description: '',
  };
}
