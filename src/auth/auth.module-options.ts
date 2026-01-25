import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/env';

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
      refreshTokenExpiresIn: this.configService.get(
        'REFRESH_TOKEN_EXPIRES_IN',
        { infer: true },
      ),
      maxUserSessions: this.configService.get('MAX_USER_SESSIONS', {
        infer: true,
      }),
    };
  }
}
