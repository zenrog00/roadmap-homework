import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Res,
  Inject,
  Ip,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { AUTH_MODULE_OPTIONS } from './auth.module-definition';
import type { AuthModuleOptions } from './auth.module-options';
import { UserDto } from 'src/users/dtos';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly authOptions: AuthModuleOptions,
  ) {}

  @Post('register')
  async registerUser(
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) response: Response,
    @Body(ValidationPipe) userDto: UserDto,
  ) {
    const { accessToken, refreshToken } = await this.authService.registerUser(
      userDto,
      ip,
      userAgent,
    );
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/auth',
      maxAge: this.authOptions.refreshTokenExpiresIn,
    });
    return { accessToken };
  }
}
