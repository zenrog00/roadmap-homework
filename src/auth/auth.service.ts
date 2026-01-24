import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from 'src/users/dtos';
import { UsersService } from 'src/users/users.service';
import { Transactional } from 'typeorm-transactional';
import { RefreshSessionsService } from './refresh-sessions.service';
import { createHash, compareWithHash } from 'src/common/utils/hash';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly refreshSessionsService: RefreshSessionsService,
  ) {}

  @Transactional()
  async registerUser(userDto: UserDto, ip: string, userAgent: string) {
    const userId = await this.createUser(userDto);
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

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (user && (await compareWithHash(password, user.password))) {
      return user;
    }
  }

  private async createUser(userDto: UserDto) {
    const { password } = userDto;
    const hashedPassword = await createHash(password);
    const userId = await this.usersService.saveUser({
      ...userDto,
      password: hashedPassword,
    });
    return userId;
  }

  private generateAccessToken(userId: string, username: string) {
    const payload = { sub: userId, username };
    return this.jwtService.sign(payload);
  }
}
