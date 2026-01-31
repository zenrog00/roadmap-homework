import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from 'src/common/decorators';
import { GetUsersQueryDto, GetUsersResponseDto, UserDto } from './dtos';

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
  async getUsers(
    @Query(new ValidationPipe({ transform: true })) query: GetUsersQueryDto,
  ): Promise<GetUsersResponseDto> {
    const { data, ...cursors } = await this.usersService.findAll(query);
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      data: data.map(({ password, ...userData }) => userData),
      ...cursors,
    };
  }

  @Put('my')
  async updateMyUser(
    @User('id') userId: string,
    @Body(ValidationPipe) userDto: UserDto,
  ) {
    await this.usersService.updateUser(userId, userDto);
  }

  @Delete('my')
  async deleteMyUser(@User('id') userId: string) {
    await this.usersService.deleteUser(userId);
  }
}
