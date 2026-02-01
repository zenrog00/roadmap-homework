import { INestApplication } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { axiosInstanceSetup, testingAppSetup } from './utils/setup';
import { UserDto, UserResponseDto } from 'src/users/dtos';
import { generateUserDto } from './utils/users';
import { uuidRegex } from './utils/regex';

let app: INestApplication;
let api: AxiosInstance;

beforeAll(async () => {
  app = await testingAppSetup();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const port = app.getHttpServer().address().port as number;
  api = axiosInstanceSetup(port);
});

afterAll(async () => {
  await app.close();
});

describe('USERS', () => {
  let userDto: UserDto;
  let accessToken: string;

  beforeEach(async () => {
    userDto = generateUserDto();
    const registerResponse = await api.post('auth/register', userDto);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    accessToken = registerResponse.data.accessToken;
  });

  describe('GET /users/my', () => {
    it('should return curent user data', async () => {
      const { data: userData } = await api.get<UserResponseDto>('users/my', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(userData).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.stringMatching(uuidRegex),
        username: userDto.username,
        email: userDto.email,
        birthdate: userDto.birthdate.toISOString().split('T')[0],
        description: userDto.description,
      });
    });

    it('should return 401 for invalid accessToken', async () => {
      const userResponse = await api.get<UserResponseDto>('users/my', {
        headers: { Authorization: `Bearer ${accessToken}_wrong` },
      });
      expect(userResponse.status).toBe(401);
    });
  });
});
