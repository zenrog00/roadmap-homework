import { AxiosResponse } from 'axios';
import { jwtRegex, uuidRegex } from '../regex';
import * as cookie from 'cookie';
import { INestApplication } from '@nestjs/common';
import { RefreshSessionsService } from 'src/auth/refresh-sessions.service';
import { AuthResponseDto } from 'src/auth/dtos';

export const expectValidAccessTokenResponse = (
  response: AxiosResponse<AuthResponseDto>,
) => {
  expect(response.data).toHaveProperty('accessToken');
  expect(typeof response.data.accessToken).toBe('string');
  expect(response.data.accessToken).toMatch(jwtRegex);
};

export const expectValidRefreshTokenCookie = (response: AxiosResponse) => {
  const rawCookie = response.headers['set-cookie']?.[0];
  expect(rawCookie).toBeDefined();
  // cookie.parse doesn't parse httpOnly because it doesn't have value
  expect(rawCookie!.toLowerCase()).toContain('httponly');

  const parsedCookie = cookie.parse(rawCookie!);
  expect(typeof parsedCookie.refreshToken).toEqual('string');
  expect(parsedCookie.Path).toEqual('/auth');
  expect(parsedCookie.Expires).toBeDefined();
  expect(new Date(parsedCookie.Expires!).getTime()).toBeGreaterThan(Date.now());

  expect(parsedCookie.refreshToken).toMatch(uuidRegex);
};

export const expectRefreshTokenRemoved = async (
  app: INestApplication,
  refreshToken?: string,
) => {
  const refreshSessionsService = app.get(RefreshSessionsService);
  const foundSession = await refreshSessionsService.findSession({
    id: refreshToken,
  });
  expect(foundSession).toBeNull();
};
