import { AxiosResponse } from 'axios';
import * as cookie from 'cookie';

export function extractRefreshToken(response: AxiosResponse) {
  const rawCookie = response.headers['set-cookie']?.[0];
  const parsedCookie = cookie.parse(rawCookie!);
  return parsedCookie;
}
