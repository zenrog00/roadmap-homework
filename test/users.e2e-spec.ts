import { INestApplication } from '@nestjs/common';
import { AxiosInstance, AxiosResponse } from 'axios';
import { axiosInstanceSetup, getAppPort, testingAppSetup } from './utils/setup';
import {
  GetUsersResponseDto,
  UserDto,
  UserMyResponseDto,
  UserResponseDto,
} from 'src/users/dtos';
import { generateUserDto } from './utils/users';
import { uuidRegex } from './utils/regex';
import { extractRefreshToken } from './utils/auth';
import { Server } from 'node:net';
import { AuthResponseDto } from 'src/auth/dtos';

let app: INestApplication<Server>;
let api: AxiosInstance;

beforeAll(async () => {
  app = await testingAppSetup();
  const port = getAppPort(app);
  api = axiosInstanceSetup(port);
});

afterAll(async () => {
  await app.close();
});

describe('USERS', () => {
  let userDto: UserDto;
  let accessToken: string;
  let refreshToken: string | undefined;

  beforeEach(async () => {
    userDto = generateUserDto();
    const registerResponse = await api.post<AuthResponseDto>(
      'auth/register',
      userDto,
    );
    accessToken = registerResponse.data.accessToken;
    refreshToken = extractRefreshToken(registerResponse).refreshToken;
  });

  describe('GET /users/my', () => {
    it('should return curent user data', async () => {
      const userResponse = await api.get<UserMyResponseDto>('users/my', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(userResponse.status).toBe(200);
      expect(userResponse.data).toEqual({
        id: expect.stringMatching(uuidRegex) as string,
        username: userDto.username,
        email: userDto.email,
        birthdate: userDto.birthdate,
        description: userDto.description,
        balance: '0.00',
      });
    });

    it('should return 401 for invalid accessToken', async () => {
      const userResponse = await api.get<UserMyResponseDto>('users/my', {
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
          data: expect.any(Array) as UserResponseDto[],
          nextCursor: expect.any(String) as string,
        });

        expect(usersResponse.data.data.length).toBeGreaterThan(0);

        expect(usersResponse.data.data[0]).toMatchObject({
          id: expect.stringMatching(uuidRegex) as string,
          username: expect.any(String) as string,
          email: expect.any(String) as string,
          birthdate: expect.any(String) as string,
          description: expect.any(String) as string,
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
          data: expect.any(Array) as UserResponseDto[],
        });

        expect(usersResponse.data.data.length).toBe(1);

        expect(usersResponse.data.data[0]).toMatchObject({
          id: expect.stringMatching(uuidRegex) as string,
          username: userDto.username,
          email: userDto.email,
          birthdate: userDto.birthdate,
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

  describe('PUT /users/my', () => {
    let userId: string;

    beforeEach(async () => {
      ({
        data: { id: userId },
      } = await api.get('users/my', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }));
    });

    describe('valid user data', () => {
      it('should update current users data in database', async () => {
        const newUserDto: UserDto = {
          ...userDto,
          username: 'user_new',
          email: 'new_email@yahoo.com',
        };
        const userUpdateResponse = await api.put('users/my', newUserDto, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(userUpdateResponse.status).toBe(200);

        const { data: userData } = await api.get<UserMyResponseDto>(
          'users/my',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        expect(userData).toEqual({
          id: userId,
          username: newUserDto.username,
          email: newUserDto.email,
          birthdate: userDto.birthdate,
          description: userDto.description,
          balance: '0.00',
        });
      });

      it('should be able to login with new password', async () => {
        const newPassword = 'new_password';
        await api.put(
          'users/my',
          { ...userDto, password: newPassword },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        const loginResponse = await api.post('auth/login', {
          username: userDto.username,
          password: newPassword,
        });
        expect(loginResponse.status).toBe(201);
      });

      it('should not be able to login with old password', async () => {
        const newPassword = 'new_password';
        await api.put(
          'users/my',
          { ...userDto, password: newPassword },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        const loginResponse = await api.post('auth/login', {
          username: userDto.username,
          password: userDto.password,
        });
        expect(loginResponse.status).toBe(401);
      });
    });

    describe('invalid user data', () => {
      it('should return 401 for invalid accessToken', async () => {
        const updateUserResponse = await api.get<UserMyResponseDto>(
          'users/my',
          {
            headers: { Authorization: `Bearer ${accessToken}_wrong` },
          },
        );
        expect(updateUserResponse.status).toBe(401);
      });

      test.each([
        { field: 'username', value: 0, when: 'is not a string' },
        { field: 'username', value: '', when: 'is empty string' },
        { field: 'email', value: 'not-email', when: 'is not valid' },
        { field: 'password', value: 0, when: 'is not a string' },
        { field: 'password', value: '', when: 'is empty string' },
        {
          field: 'birthdate',
          value: 'not-date',
          when: 'is not ISO8601',
        },
        {
          field: 'description',
          value: 0,
          when: 'is not a string',
        },
        {
          field: 'description',
          value: 'a'.repeat(1001),
          when: 'is more than 1000 symbols',
        },
      ])('should return 400 when $field $when', async ({ field, value }) => {
        const response = await api.put(
          'users/my',
          {
            ...userDto,
            [field]: value,
          },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        expect(response.status).toBe(400);
      });
    });
  });

  describe('DELETE /users/my', () => {
    describe('success responses', () => {
      let deleteResponse: AxiosResponse;

      beforeEach(async () => {
        deleteResponse = await api.delete('users/my', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      });

      it('should return 200 response status', () => {
        expect(deleteResponse.status).toBe(200);
      });

      it(`should return 404 on user's data requests`, async () => {
        const authHeader = { Authorization: `Bearer ${accessToken}` };
        const [myUserResponse, userByUsernameResponse] = await Promise.all([
          api.get('users/my', {
            headers: authHeader,
          }),
          api.get('users', {
            params: {
              username: userDto.username,
            },
            headers: authHeader,
          }),
        ]);
        expect(myUserResponse.status).toBe(404);
        expect(userByUsernameResponse.status).toBe(404);
      });

      it('should not be able to login', async () => {
        const loginResponse = await api.post('auth/login', {
          username: userDto.username,
          password: userDto.password,
        });
        expect(loginResponse.status).toBe(401);
      });

      it('should not be able to refresh tokens', async () => {
        const refreshResponse = await api.post(
          'auth/refresh-tokens',
          {},
          {
            headers: {
              Cookie: `refreshToken=${refreshToken}`,
            },
          },
        );
        expect(refreshResponse.status).toBe(401);
      });
    });

    describe('error responses', () => {
      it('should return 401 for invalid accessToken', async () => {
        const deleteUserResponse = await api.delete('users/my', {
          headers: { Authorization: `Bearer ${accessToken}_wrong` },
        });
        expect(deleteUserResponse.status).toBe(401);
      });
    });
  });
});
