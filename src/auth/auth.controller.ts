import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Res,
  Inject,
  UseGuards,
  ParseUUIDPipe,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { AUTH_MODULE_OPTIONS } from './auth.module-definition';
import type { AuthModuleOptions } from './auth.module-options';
import { UserDto } from 'src/users/dtos';
import { LocalAuthGuard } from './guards';
import { Cookie, Fingerprint, User } from 'src/common/decorators';
import { ApiAuthResponse, Public } from './decorators';
import { AuthResponseDto } from './dtos';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
} from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly authOptions: AuthModuleOptions,
  ) {}

  @Public()
  @Post('register')
  @ApiAuthResponse('User and user session were created successfully')
  async registerUser(
    @Fingerprint() fingerprint: string,
    @Res({ passthrough: true }) response: Response,
    @Body(ValidationPipe) userDto: UserDto,
  ): Promise<AuthResponseDto> {
    const { accessToken, refreshToken } = await this.authService.registerUser(
      userDto,
      fingerprint,
    );
    this.createRefreshTokenCookie(response, refreshToken);
    return { accessToken };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiBasicAuth()
  @ApiAuthResponse('User session was created successfully')
  async loginUser(
    @Fingerprint() fingerprint: string,
    @Res({ passthrough: true }) response: Response,
    @User('id') userId: string,
    @User('username') username: string,
  ) {
    const { accessToken, refreshToken } = await this.authService.loginUser(
      userId,
      username,
      fingerprint,
    );
    this.createRefreshTokenCookie(response, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('refresh-tokens')
  @ApiOperation({
    summary:
      'Get new access and refresh tokens. Needs to have refreshToken cookie set',
  })
  @ApiSecurity('RefreshSession')
  @ApiAuthResponse(
    'Created new access and refresh tokens. Old refresh token session was replaced',
  )
  async refreshTokens(
    @Fingerprint() fingerprint: string,
    @Res({ passthrough: true }) response: Response,
    @Cookie(
      'refreshToken',
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new UnauthorizedException('Invalid or expired refresh token!'),
      }),
    )
    refreshToken: string,
  ) {
    const tokens = await this.authService.refreshTokens(
      refreshToken,
      fingerprint,
    );
    this.createRefreshTokenCookie(response, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Logout from current user session',
  })
  @ApiSecurity('RefreshSession')
  @ApiOkResponse({
    description: 'Removed provided refreshToken cookie session',
  })
  async logoutUserSession(
    @Cookie(
      'refreshToken',
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new UnauthorizedException('Invalid or expired refresh token!'),
      }),
    )
    refreshToken: string,
  ) {
    await this.authService.logoutUserSession(refreshToken);
  }

  @HttpCode(200)
  @Post('logout/all')
  @ApiOperation({
    summary: 'Logout from all current user sessions',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Removed all current user sessions',
  })
  async logoutAllUserSessions(@User('id') userId: string) {
    await this.authService.logoutAllUserSessions(userId);
  }

  private createRefreshTokenCookie(response: Response, refreshToken: string) {
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/auth',
      maxAge: this.authOptions.refreshTokenExpiresIn,
    });
  }
}
