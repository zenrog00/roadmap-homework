import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from 'src/common/decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('my')
  async getMyUser(@User('id') userId: string) {
    const user = await this.usersService.findOneBy({
      id: userId,
    });
    if (!user) {
      throw new NotFoundException("User's data not found!");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, id, ...userData } = user;
    return userData;
  }

  @Get()
  async getUsers(@Query('username') username?: string) {
    const users = await this.usersService.findAll(username);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ password, ...userData }) => userData);
  }
}
