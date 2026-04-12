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
import {
  GetMostActiveUsersQueryDto,
  GetUsersQueryDto,
  GetUsersResponseDto,
  UserDto,
  UserResponseDto,
} from './dtos';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { GetMostActiveUsersResponseDto } from './dtos/get-most-active-users-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('my')
  @ApiOperation({
    summary: 'Get current user data',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'Current user data',
  })
  async getMyUser(@User('id') userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOneBy({
      id: userId,
    });
    if (!user) {
      throw new NotFoundException("User's data not found!");
    }
    const { password, ...userData } = user;
    return userData;
  }

  @Get()
  @ApiOperation({
    summary: 'Get cursor paginated users data with optional username filter',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    type: GetUsersResponseDto,
    description: 'Cursor paginated users data',
  })
  async getUsers(
    @Query(new ValidationPipe({ transform: true })) query: GetUsersQueryDto,
  ): Promise<GetUsersResponseDto> {
    const { data, ...cursors } = await this.usersService.findAll(query);
    if (query.username && data.length === 0) {
      throw new NotFoundException("User's data not found!");
    }
    return {
      data,
      ...cursors,
    };
  }

  @Get('most-active')
  async getMostActiveUsers(
    @Query(new ValidationPipe({ transform: true }))
    query: GetMostActiveUsersQueryDto,
  ): Promise<GetMostActiveUsersResponseDto> {
    return await this.usersService.findMostActive(query);
  }

  @ApiOperation({
    summary: 'Updates current user data',
  })
  @ApiBearerAuth()
  @Put('my')
  @ApiOkResponse({
    description: 'Current user data was updated',
  })
  async updateMyUser(
    @User('id') userId: string,
    @Body(ValidationPipe) userDto: UserDto,
  ) {
    await this.usersService.updateUser(userId, userDto);
  }

  @Delete('my')
  @ApiOperation({
    summary: 'Soft deletes current user',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Current user was soft deleted',
  })
  async deleteMyUser(@User('id') userId: string) {
    await this.usersService.deleteUser(userId);
  }
}
