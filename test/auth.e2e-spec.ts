import { INestApplication } from '@nestjs/common';
import { AxiosInstance, AxiosResponse } from 'axios';
import { GetUsersResponseDto, UserDto, UserResponseDto } from 'src/users/dtos';
import { axiosInstanceSetup, testingAppSetup } from './utils/setup';
import { uuidRegex } from './utils/regex';
import {
  expectRefreshTokenRemoved,
  expectValidAccessTokenResponse,
  expectValidRefreshTokenCookie,
} from './utils/assertions/auth.assertions';
import { RefreshSessionsService } from 'src/auth/refresh-sessions.service';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/env';
import { extractRefreshToken } from './utils/auth';
import { generateUserDto } from './utils/users';

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

describe('AUTH', () => {
  let userDto: UserDto;

  beforeEach(() => {
    userDto = generateUserDto();
  });

  describe('POST /auth/register', () => {
    describe('valid user data', () => {
      let response: AxiosResponse;

      beforeEach(async () => {
        response = await api.post('/auth/register', userDto);
      });

      it('should return 201 response status', () => {
        expect(response.status).toBe(201);
      });

      it('should return JWT accessToken', () => {
        expectValidAccessTokenResponse(response);
      });

      it('should return HttpOnly refreshToken cookie with path /auth', () => {
        expectValidRefreshTokenCookie(response);
      });

      it('should save user to database', async () => {
        const userResponse = await api.get<GetUsersResponseDto>('users', {
          params: {
            username: userDto.username,
          },
          headers: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            Authorization: `Bearer ${response.data.accessToken}`,
          },
        });
        const userData = userResponse.data.data[0];
        expect(userData).toEqual({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          id: expect.stringMatching(uuidRegex),
          username: userDto.username,
          email: userDto.email,
          birthdate: userDto.birthdate.toISOString().split('T')[0],
          description: userDto.description,
        });
      });

      it('should not register users with same username', async () => {
        const repeatedUsernameResponse = await api.post('/auth/register', {
          ...userDto,
          email: `${Date.now()}@yahoo.com`,
        });
        expect(repeatedUsernameResponse.data).toMatchObject({
          statusCode: 400,
          message: `Username or email already exists!`,
        });
      });

      it('should not register users with same email', async () => {
        const repeatedEmailResponse = await api.post('/auth/register', {
          ...userDto,
          username: `user_${Date.now()}`,
        });
        expect(repeatedEmailResponse.data).toMatchObject({
          statusCode: 400,
          message: `Username or email already exists!`,
        });
      });
    });

    describe('invalid user data', () => {
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
        const response = await api.post('/auth/register', {
          ...userDto,
          [field]: value,
        });
        expect(response.status).toBe(400);
      });
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await api.post('/auth/register', userDto);
    });

    describe('valid username and password', () => {
      let response: AxiosResponse;

      beforeEach(async () => {
        response = await api.post('auth/login', {
          username: userDto.username,
          password: userDto.password,
        });
      });

      it('should return 201 response status', () => {
        expect(response.status).toBe(201);
      });

      it('should return JWT accessToken', () => {
        expectValidAccessTokenResponse(response);
      });

      it('should return HttpOnly refreshToken cookie with path /auth', () => {
        expectValidRefreshTokenCookie(response);
      });

      it('multiple logins should create not more than MAX_USER_SESSIONS env variable', async () => {
        const requestBody = {
          username: userDto.username,
          password: userDto.password,
        };
        await Promise.all(
          Array.from({ length: 6 }, () => api.post('/auth/login', requestBody)),
        );

        const {
          data: { id: userId },
        } = await api.get<UserResponseDto>('users/my', {
          headers: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            Authorization: `Bearer ${response.data.accessToken}`,
          },
        });

        const configService =
          app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
        const maxSessionsCount = configService.get('MAX_USER_SESSIONS', {
          infer: true,
        });

        const refreshSessionService = app.get(RefreshSessionsService);
        const userSessionsCount =
          await refreshSessionService.countActiveSessions(userId);
        expect(userSessionsCount).toBeLessThanOrEqual(maxSessionsCount);
      });
    });

    describe('invalid username or password', () => {
      it('should return 401 with invalid username', async () => {
        const response = await api.post('auth/login', {
          username: 'wrong_user',
          password: userDto.password,
        });
        expect(response.status).toBe(401);
      });

      it('should return 401 with invalid password', async () => {
        const response = await api.post('auth/login', {
          username: userDto.password,
          password: userDto.username,
        });
        expect(response.status).toBe(401);
      });
    });
  });

  describe('POST /auth/refresh-tokens', () => {
    let oldAccessToken: string;
    let oldRefreshToken: string | undefined;

    beforeEach(async () => {
      const registerResponse = await api.post('auth/register', userDto);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      oldAccessToken = registerResponse.data.accessToken;
      ({ refreshToken: oldRefreshToken } =
        extractRefreshToken(registerResponse));
    });

    describe('valid refreshToken', () => {
      let refreshResponse: AxiosResponse;

      beforeEach(async () => {
        refreshResponse = await api.post(
          'auth/refresh-tokens',
          {},
          {
            headers: {
              Cookie: `refreshToken=${oldRefreshToken}`,
            },
          },
        );
      });

      it('should return 201 response status', () => {
        expect(refreshResponse.status).toBe(201);
      });

      it('should return JWT accessToken', () => {
        expectValidAccessTokenResponse(refreshResponse);
      });

      it('should return HttpOnly refreshToken cookie with path /auth', () => {
        expectValidRefreshTokenCookie(refreshResponse);
      });

      it('should return different tokens', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(oldAccessToken).not.toBe(refreshResponse.data.accessToken);
        const { refreshToken: newRefreshToken } =
          extractRefreshToken(refreshResponse);
        expect(oldRefreshToken).not.toBe(newRefreshToken);
      });

      it('should remove old refreshToken from database', async () => {
        await expectRefreshTokenRemoved(app, oldRefreshToken);
      });

      it('should save new refreshToken to database', async () => {
        const { refreshToken: newRefreshToken } =
          extractRefreshToken(refreshResponse);
        const refreshSessionsService = app.get(RefreshSessionsService);
        const foundSession = await refreshSessionsService.findOneBy({
          id: newRefreshToken,
        });
        expect(foundSession).not.toBeNull();
      });
    });

    describe('invalid refreshToken', () => {
      it('should return 401 response status', async () => {
        const refreshResponse = await api.post(
          'auth/refresh-tokens',
          {},
          {
            headers: {
              Cookie: `refreshToken=${oldRefreshToken}_wrong`,
            },
          },
        );
        expect(refreshResponse.data).toMatchObject({
          statusCode: 401,
          message: 'Invalid or expired refresh token!',
        });
      });
    });

    describe('valid refreshToken and diffent fingerprint', () => {
      let refreshResponse: AxiosResponse;

      beforeEach(async () => {
        refreshResponse = await api.post(
          'auth/refresh-tokens',
          {},
          {
            headers: {
              Cookie: `refreshToken=${oldRefreshToken}`,
              'User-Agent': 'Test UA',
            },
          },
        );
      });

      it('should return 401 response status', () => {
        expect(refreshResponse.data).toMatchObject({
          statusCode: 401,
          message: 'Invalid or expired refresh token!',
        });
      });

      it('should remove old refreshToken from database', async () => {
        await expectRefreshTokenRemoved(app, oldRefreshToken);
      });
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;
    let refreshToken: string | undefined;

    beforeEach(async () => {
      const registerResponse = await api.post('auth/register', userDto);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      accessToken = registerResponse.data.accessToken;
      refreshToken = extractRefreshToken(registerResponse).refreshToken;
    });

    describe('valid tokens', () => {
      let logoutResponse: AxiosResponse;

      beforeEach(async () => {
        logoutResponse = await api.post(
          'auth/logout',
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Cookie: `refreshToken=${refreshToken}`,
            },
          },
        );
      });

      it('should return 201 response status', () => {
        expect(logoutResponse.status).toBe(200);
      });

      it('should remove refreshToken from database', async () => {
        await expectRefreshTokenRemoved(app, refreshToken);
      });

      it('should return 401 on attempts to refresh with same refreshToken', async () => {
        const refreshResponse = await api.post(
          'auth/refresh-tokens',
          {},
          {
            headers: {
              Cookie: `refreshToken=${refreshToken}`,
            },
          },
        );
        expect(refreshResponse.data).toMatchObject({
          statusCode: 401,
          message: 'Invalid or expired refresh token!',
        });
      });
    });

    describe('invalid tokens', () => {
      it('should return 401 with invalid accessToken', async () => {
        const logoutResponse = await api.post(
          'auth/logout',
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}_wrong`,
              Cookie: `refreshToken=${refreshToken}`,
            },
          },
        );
        expect(logoutResponse.status).toBe(401);
      });

      it('should return 401 with invalid refreshToken', async () => {
        const logoutResponse = await api.post(
          'auth/logout',
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Cookie: `refreshToken=${refreshToken}_wrong`,
            },
          },
        );
        expect(logoutResponse.status).toBe(401);
      });
    });
  });

  describe('POST /auth/logout/all', () => {
    let accessToken: string;
    let refreshToken: string | undefined;
    let userId: string;

    beforeEach(async () => {
      const registerResponse = await api.post('auth/register', userDto);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      accessToken = registerResponse.data.accessToken;
      refreshToken = extractRefreshToken(registerResponse).refreshToken;
      ({
        data: { id: userId },
      } = await api.get('users/my', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }));
    });

    describe('valid tokens', () => {
      let logoutAllResponse: AxiosResponse;

      beforeEach(async () => {
        logoutAllResponse = await api.post(
          'auth/logout/all',
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
      });

      it('should return 201 response status', () => {
        expect(logoutAllResponse.status).toBe(200);
      });

      it('should remove all user refreshTokens from database', async () => {
        const refreshSessionsService = app.get(RefreshSessionsService);
        const sessionsCount =
          await refreshSessionsService.countActiveSessions(userId);
        expect(sessionsCount).toBe(0);
      });

      it('should return 401 on attempts to refresh with same refreshToken', async () => {
        const refreshResponse = await api.post(
          'auth/refresh-tokens',
          {},
          {
            headers: {
              Cookie: `refreshToken=${refreshToken}`,
            },
          },
        );
        expect(refreshResponse.data).toMatchObject({
          statusCode: 401,
          message: 'Invalid or expired refresh token!',
        });
      });
    });

    describe('invalid tokens', () => {
      it('should return 401 with invalid accessToken', async () => {
        const logoutAllResponse = await api.post(
          'auth/logout/all',
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}_wrong`,
            },
          },
        );
        expect(logoutAllResponse.status).toBe(401);
      });
    });
  });
});
