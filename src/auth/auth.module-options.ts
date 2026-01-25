import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/env';
import ms, { StringValue } from 'ms';

export interface AuthModuleOptions {
  jwtSecret: string;
  refreshTokenExpiresIn: number;
  maxUserSessions: number;
}

@Injectable()
export class AuthModuleOptionsFactory {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  createAuthModuleOptions(): AuthModuleOptions {
    return {
      jwtSecret: this.configService.get('JWT_SECRET', { infer: true }),
      refreshTokenExpiresIn: ms(
        // for some reason typescript can't get type of REFRESH_TOKEN_EXPIRES_IN
        // and returns number, so eslint gives warning when using type assertion
        // which is disabled in next line
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        this.configService.get('REFRESH_TOKEN_EXPIRES_IN', {
          infer: true,
        }) as StringValue,
      ),
      maxUserSessions: this.configService.get('MAX_USER_SESSIONS', {
        infer: true,
      }),
    };
  }
}
