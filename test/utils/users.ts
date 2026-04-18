import { randomUUID } from 'node:crypto';
import { UserDto } from 'src/users/dtos';

export function generateUserDto(): UserDto {
  const randomId = randomUUID();

  return {
    username: `user_${randomId}}`,
    email: `${randomId}}@yahoo.com`,
    password: 'test_pass',
    birthdate: new Date().toISOString().split('T')[0],
    description: '',
  };
}
