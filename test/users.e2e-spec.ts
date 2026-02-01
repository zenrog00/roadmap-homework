/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { axiosInstanceSetup, testingAppSetup } from './utils/setup';
import { GetUsersResponseDto, UserDto, UserResponseDto } from 'src/users/dtos';
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    accessToken = registerResponse.data.accessToken;
  });

  describe('GET /users/my', () => {
    it('should return curent user data', async () => {
      const userResponse = await api.get<UserResponseDto>('users/my', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(userResponse.status).toBe(200);
      expect(userResponse.data).toEqual({
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

  describe('GET /users', () => {
    beforeAll(async () => {
      await Promise.all(
        Array.from({ length: 11 }, () =>
          api.post('auth/register', generateUserDto()),
        ),
      );
    });

    describe('success responses', () => {
      it('should return GetUsersResponseDto object', async () => {
        const usersResponse = await api.get<GetUsersResponseDto>('users', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        expect(usersResponse.status).toBe(200);

        expect(usersResponse.data).toMatchObject({
          data: expect.any(Array),
          nextCursor: expect.any(String),
        });

        expect(usersResponse.data.data.length).toBeGreaterThan(0);

        expect(usersResponse.data.data[0]).toMatchObject({
          id: expect.stringMatching(uuidRegex),
          username: expect.any(String),
          email: expect.any(String),
          birthdate: expect.any(String),
          description: expect.any(String),
        });
      });

      it('should return data only for one user when username param specified', async () => {
        const usersResponse = await api.get<GetUsersResponseDto>('users', {
          params: {
            username: userDto.username,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(usersResponse.data).toEqual({
          data: expect.any(Array),
        });

        expect(usersResponse.data.data.length).toBe(1);

        expect(usersResponse.data.data[0]).toMatchObject({
          id: expect.stringMatching(uuidRegex),
          username: userDto.username,
          email: userDto.email,
          birthdate: userDto.birthdate.toISOString().split('T')[0],
          description: userDto.description,
        });
      });

      it('should return not more than 10 elements when limit param not specified', async () => {
        const usersResponse = await api.get<GetUsersResponseDto>('users', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        expect(usersResponse.data.data.length).toBeLessThanOrEqual(10);
      });

      it('should return not more than limit elements when limit param not specified', async () => {
        const limit = 5;
        const usersResponse = await api.get<GetUsersResponseDto>('users', {
          params: {
            limit,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        expect(usersResponse.data.data.length).toBeLessThanOrEqual(limit);
      });

      it('should return next page when cursor param specified', async () => {
        const firstPage = await api.get<GetUsersResponseDto>('users', {
          params: { limit: 5 },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const cursor = firstPage.data.nextCursor;
        const firstPageLastUser = firstPage.data.data.at(-1);

        expect(cursor).toBeDefined();

        const secondPage = await api.get<GetUsersResponseDto>('users', {
          params: { limit: 5, cursor: cursor },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(secondPage.data.data.length).toBeGreaterThan(0);
        expect(secondPage.data.data[0].id).not.toBe(firstPageLastUser!.id);
        expect(secondPage.data.prevCursor).toBeDefined();
      });

      it('should return previous page when cursor and isPrevious params specified', async () => {
        const firstPage = await api.get<GetUsersResponseDto>('users', {
          params: { limit: 5 },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const secondPage = await api.get<GetUsersResponseDto>('users', {
          params: { limit: 5, cursor: firstPage.data.nextCursor },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const prevCursor = secondPage.data.prevCursor;
        expect(prevCursor).toBeDefined();

        const backToFirstPage = await api.get<GetUsersResponseDto>('users', {
          params: {
            limit: 5,
            cursor: prevCursor,
            isPrevious: true,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(backToFirstPage.data.data.length).toBe(
          firstPage.data.data.length,
        );
        expect(backToFirstPage.data.data).toEqual(firstPage.data.data);
        expect(backToFirstPage.data.prevCursor).toBeUndefined();
      });
    });

    describe('error responses', () => {
      it('should return 401 for invalid accessToken', async () => {
        const usersResponse = await api.get<UserResponseDto>('users', {
          headers: { Authorization: `Bearer ${accessToken}_wrong` },
        });
        expect(usersResponse.status).toBe(401);
      });

      it('should return 404 when username param is not found', async () => {
        const usersResponse = await api.get<UserResponseDto>('users', {
          params: {
            username: 'wrong_user',
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        expect(usersResponse.status).toBe(404);
      });
    });
  });
});
