import { AxiosResponse } from 'axios';
import { jwtRegex, uuidRegex } from '../regex';
import * as cookie from 'cookie';

export const expectValidAccessTokenResponse = (response: AxiosResponse) => {
  expect(response.data).toHaveProperty('accessToken');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(typeof response.data.accessToken).toBe('string');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
