import { Controller, Get, NotFoundException } from '@nestjs/common';
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
}
