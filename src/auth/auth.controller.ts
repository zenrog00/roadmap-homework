import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Res,
  Inject,
} from '@nestjs/common';
import { UserDto } from './common/dtos';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { AUTH_MODULE_OPTIONS } from './auth.module-definition';
import type { AuthModuleOptions } from './common/options';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly authOptions: AuthModuleOptions,
  ) {}

  @Post('register')
  registerUser(
    @Res({ passthrough: true }) response: Response,
    @Body(ValidationPipe) userDto: UserDto,
  ) {
    const { accessToken, refreshToken } =
      this.authService.registerUser(userDto);
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/auth',
      maxAge: this.authOptions.refreshTokenExpiresIn,
    });
    return { accessToken };
  }
}
