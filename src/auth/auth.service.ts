import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from 'src/users/dtos';
import { UsersService } from 'src/users/users.service';
import { Transactional } from 'typeorm-transactional';
import { RefreshSessionsService } from './refresh-sessions.service';
import { compareWithHash } from 'src/common/utils/hash';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly refreshSessionsService: RefreshSessionsService,
  ) {}

  @Transactional()
  async registerUser(userDto: UserDto, ip: string, userAgent: string) {
    const userId = await this.usersService.saveUser(userDto);
    return {
      accessToken: this.generateAccessToken(userId, userDto.username),
      refreshToken: await this.refreshSessionsService.createSession(
        userId,
        ip,
        userAgent,
      ),
    };
  }

  async loginUser(
    userId: string,
    username: string,
    ip: string,
    userAgent: string,
  ) {
    return {
      accessToken: this.generateAccessToken(userId, username),
      refreshToken: await this.refreshSessionsService.createSession(
        userId,
        ip,
        userAgent,
      ),
    };
  }

  @Transactional()
  async refreshTokens(ip: string, userAgent: string, refreshToken?: string) {
    // there are two possibilities:
    // 1. session expired and has same fingerpint, so it's valid
    // 2. session expired or has different fingerpint (it was probably stolen), so it's not valid
    // in both cases session should be deleted and replaced
    const refreshSession =
      await this.refreshSessionsService.findAndDeleteSession(refreshToken);
    const validatedRefreshSession =
      await this.refreshSessionsService.validateSession(
        refreshSession,
        ip,
        userAgent,
      );
    if (!validatedRefreshSession) {
      throw new UnauthorizedException('Invalid or expired refresh token!');
    }

    const {
      user: { id: userId, username },
    } = validatedRefreshSession;

    return {
      accessToken: this.generateAccessToken(userId, username),
      refreshToken: await this.refreshSessionsService.createSession(
        userId,
        ip,
        userAgent,
      ),
    };
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findOneBy({ username });
    if (user && (await compareWithHash(password, user.password))) {
      return user;
    }
  }

  async logoutUserSession(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token!');
    }
    await this.refreshSessionsService.deleteSession({ id: refreshToken });
  }

  async logoutAllUserSessions(userId: string) {
    await this.refreshSessionsService.deleteSession({ userId });
  }

  private generateAccessToken(userId: string, username: string) {
    const payload = { sub: userId, username };
    return this.jwtService.sign(payload);
  }
}
