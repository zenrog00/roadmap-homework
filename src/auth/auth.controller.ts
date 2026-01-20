import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { UserDto } from './common/dtos';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async registerUser(@Body(ValidationPipe) userDto: UserDto) {
    return await this.authService.registerUser(userDto);
  }
}
