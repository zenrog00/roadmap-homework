import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from 'src/users/dtos';
import { UsersService } from 'src/users/users.service';
import { Transactional } from 'typeorm-transactional';
import { RefreshSessionsService } from './refresh-sessions.service';
import { compareWithHash } from 'src/common/utils/hash';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly refreshSessionsService: RefreshSessionsService,
  ) {}

  @Transactional()
  async registerUser(userDto: UserDto, fingeprint: string) {
    const userId = await this.usersService.saveUser(userDto);
    return {
      accessToken: this.generateAccessToken(userId, userDto.username),
      refreshToken: await this.refreshSessionsService.createSession(
        userId,
        fingeprint,
      ),
    };
  }

  async loginUser(userId: string, username: string, fingeprint: string) {
    return {
      accessToken: this.generateAccessToken(userId, username),
      refreshToken: await this.refreshSessionsService.createSession(
        userId,
        fingeprint,
      ),
    };
  }

  async refreshTokens(refreshToken: string, fingeprint: string) {
    const refreshSession = await this.refreshSessionsService.findOneBy({
      id: refreshToken,
    });

    const validatedRefreshSession =
      await this.refreshSessionsService.validateSession(
        refreshSession,
        fingeprint,
      );
    if (!validatedRefreshSession) {
      if (refreshSession) {
        // if session wasn't validated than it's either expired
        // or fingerprint doesn't match and it was probably stolen
        // in both cases we need to delete it
        await this.refreshSessionsService.deleteSession({
          id: refreshSession.id,
        });
      }
      throw new UnauthorizedException('Invalid or expired refresh token!');
    }

    const {
      user: { id: userId, username },
    } = validatedRefreshSession;

    return {
      accessToken: this.generateAccessToken(userId, username),
      refreshToken: await this.refreshSessionsService.replaceSession(
        validatedRefreshSession,
        fingeprint,
      ),
    };
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findOneBy({ username });
    if (user && (await compareWithHash(password, user.password))) {
      return user;
    }
  }

  async logoutUserSession(refreshToken: string) {
    await this.refreshSessionsService.deleteSession({ id: refreshToken });
  }

  async logoutAllUserSessions(userId: string) {
    await this.refreshSessionsService.deleteSession({ userId });
  }

  private generateAccessToken(userId: string, username: string) {
    const payload = { sub: userId, username, jti: randomUUID() };
    return this.jwtService.sign(payload);
  }
}
