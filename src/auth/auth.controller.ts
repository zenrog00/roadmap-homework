import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Res,
  Inject,
  Ip,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { AUTH_MODULE_OPTIONS } from './auth.module-definition';
import type { AuthModuleOptions } from './auth.module-options';
import { UserDto } from 'src/users/dtos';
import { LocalAuthGuard } from './guards';
import { Cookie, User } from 'src/common/decorators';
import { Public } from './decorators';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly authOptions: AuthModuleOptions,
  ) {}

  @Public()
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
    this.createRefreshTokenCookie(response, refreshToken);
    return { accessToken };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async loginUser(
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) response: Response,
    @User('id') userId: string,
    @User('username') username: string,
  ) {
    const { accessToken, refreshToken } = await this.authService.loginUser(
      userId,
      username,
      ip,
      userAgent,
    );
    this.createRefreshTokenCookie(response, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('refresh-tokens')
  async refreshTokens(
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) response: Response,
    @Cookie('refreshToken') refreshToken?: string,
  ) {
    const tokens = await this.authService.refreshTokens(
      ip,
      userAgent,
      refreshToken,
    );
    this.createRefreshTokenCookie(response, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  async logoutUserSession(@Cookie('refreshToken') refreshToken?: string) {
    await this.authService.logoutUserSession(refreshToken);
  }

  private createRefreshTokenCookie(response: Response, refreshToken: string) {
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/auth',
      maxAge: this.authOptions.refreshTokenExpiresIn,
    });
  }
}
