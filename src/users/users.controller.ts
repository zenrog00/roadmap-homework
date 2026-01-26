import {
  Controller,
  Get,
  NotFoundException,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from 'src/common/decorators';
import { GetUsersQueryDto } from './dtos';
import { Public } from 'src/auth/decorators';

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

  @Public()
  @Get()
  async getUsers(
    @Query(new ValidationPipe({ transform: true })) query: GetUsersQueryDto,
  ) {
    const { data, nextCursor } = await this.usersService.findAll(query);
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      data: data.map(({ password, ...userData }) => userData),
      nextCursor,
    };
  }
}
