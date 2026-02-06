import { ParseUUIDPipe, UnauthorizedException } from '@nestjs/common';
import { Cookie } from 'src/common/decorators';

export function RefreshTokenCookie() {
  return Cookie(
    'refreshToken',
    new ParseUUIDPipe({
      exceptionFactory: () =>
        new UnauthorizedException('Invalid or expired refresh token!'),
    }),
  );
}
