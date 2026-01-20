import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from './common/dtos';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async registerUser(userDto: UserDto) {}
}
