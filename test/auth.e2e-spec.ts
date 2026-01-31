import { INestApplication } from '@nestjs/common';
import { AxiosInstance, AxiosResponse } from 'axios';
import { GetUsersResponseDto, UserDto } from 'src/users/dtos';
import * as cookie from 'cookie';
import { axiosInstanceSetup, testingAppSetup } from './utils/setup';
import { jwtRegex, uuidRegex } from './utils/regex';

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
    userDto = {
      username: `user_${Date.now()}`,
      email: `${Date.now()}@yahoo.com`,
      password: 'test_pass',
      birthdate: new Date(),
      description: '',
    };
  });

  describe('POST /auth/register', () => {
    describe('valid user data', () => {
      let response: AxiosResponse;

      beforeEach(async () => {
        response = await api.post('/auth/register', userDto);
      });

      it('should return 201 response code', () => {
        expect(response.status).toBe(201);
      });

      it('should return JWT accessToken', () => {
        expect(response.data).toHaveProperty('accessToken');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(typeof response.data.accessToken).toBe('string');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(response.data.accessToken).toMatch(jwtRegex);
      });

      it('should return HttpOnly refreshToken cookie with path /auth', () => {
        const rawCookie = response.headers['set-cookie']?.[0];
        expect(rawCookie).toBeDefined();
        // cookie.parse doesn't parse httpOnly because it doesn't have value
        expect(rawCookie!.toLowerCase()).toContain('httponly');

        const parsedCookie = cookie.parse(rawCookie!);
        expect(typeof parsedCookie.refreshToken).toEqual('string');
        expect(parsedCookie.Path).toEqual('/auth');
        expect(parsedCookie.Expires).toBeDefined();
        expect(new Date(parsedCookie.Expires!).getTime()).toBeGreaterThan(
          Date.now(),
        );

        expect(parsedCookie.refreshToken).toMatch(uuidRegex);
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

    it('should return 201 with valid username and password', async () => {
      const response = await api.post('auth/login', {
        username: userDto.username,
        password: userDto.password,
      });

      expect(response.status).toBe(201);
    });

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
