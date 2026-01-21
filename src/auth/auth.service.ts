import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { UserDto } from 'src/users/dtos';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async registerUser(userDto: UserDto) {
    await this.usersService.saveUser(userDto);
    const payload = { sub: uuidv4(), username: userDto.username };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: uuidv4(),
    };
  }
}
