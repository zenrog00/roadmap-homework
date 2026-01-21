import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/env';

export interface AuthModuleOptions {
  refreshTokenExpiresIn: number;
}

@Injectable()
export class AuthModuleOptionsFactory {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  createAuthModuleOptions(): AuthModuleOptions {
    return {
      refreshTokenExpiresIn: this.configService.get(
        'REFRESH_TOKEN_EXPIRES_IN',
        { infer: true },
      ),
    };
  }
}
