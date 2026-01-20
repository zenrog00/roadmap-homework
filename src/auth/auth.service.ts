import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from './common/dtos';
import { v4 as uuidv4 } from 'uuid';
import { AUTH_MODULE_OPTIONS } from './auth.module-definition';
import type { AuthModuleOptions } from './common/options';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly authModuleOptions: AuthModuleOptions,
  ) {}

  registerUser(userDto: UserDto) {
    const payload = { sub: uuidv4(), username: userDto.username };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: uuidv4(),
    };
  }
}
