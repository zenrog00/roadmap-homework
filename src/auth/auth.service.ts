import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from 'src/users/dtos';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RefreshSession } from './entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AUTH_MODULE_OPTIONS } from './auth.module-definition';
import type { AuthModuleOptions } from './auth.module-options';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectRepository(RefreshSession)
    private readonly refreshSessionRepository: Repository<RefreshSession>,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly authModuleOption: AuthModuleOptions,
  ) {}

  @Transactional()
  async registerUser(userDto: UserDto, ip: string, userAgent: string) {
    const userId = await this.createUser(userDto);
    return {
      accessToken: this.generateAccessToken(userId, userDto.username),
      refreshToken: await this.createRefreshSession(userId, ip, userAgent),
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
      refreshToken: await this.createRefreshSession(userId, ip, userAgent),
    };
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (user && (await this.compareWithHash(password, user.password))) {
      return user;
    }
  }

  private async createUser(userDto: UserDto) {
    const { password } = userDto;
    const hashedPassword = await this.createHash(password);
    const userId = await this.usersService.saveUser({
      ...userDto,
      password: hashedPassword,
    });
    return userId;
  }

  private async createRefreshSession(
    userId: string,
    ip: string,
    userAgent: string,
  ) {
    const fingeprint = this.createFingerpint(ip, userAgent);
    const hashedFingerpint = await this.createHash(fingeprint);
    const refreshSession = this.refreshSessionRepository.create({
      userId,
      fingeprint: hashedFingerpint,
      expiresIn: this.authModuleOption.refreshTokenExpiresIn,
    });
    const { id } = await this.refreshSessionRepository.save(refreshSession);
    return id;
  }

  private async createHash(s: string) {
    const saltOrRounds = 10;
    return await bcrypt.hash(s, saltOrRounds);
  }

  private async compareWithHash(s: string, hash: string) {
    return await bcrypt.compare(s, hash);
  }

  private generateAccessToken(userId: string, username: string) {
    const payload = { sub: userId, username };
    return this.jwtService.sign(payload);
  }

  private createFingerpint(ip: string, userAgent: string) {
    const separator = '|';
    return ip + separator + userAgent;
  }
}
