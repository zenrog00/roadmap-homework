import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { UserDto } from 'src/users/dtos';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async registerUser(userDto: UserDto) {
    const { password } = userDto;
    const hashedPassword = await this.hashPassword(password);
    const userId = await this.usersService.saveUser({
      ...userDto,
      password: hashedPassword,
    });
    return this.generateTokens(userId, userDto.username);
  }

  private async hashPassword(password: string) {
    const saltOrRounds = 10;
    return await bcrypt.hash(password, saltOrRounds);
  }

  private generateTokens(userId: string, username: string) {
    const payload = { sub: userId, username };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: uuidv4(),
    };
  }
}
