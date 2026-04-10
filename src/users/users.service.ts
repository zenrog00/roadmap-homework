import { BadRequestException, Injectable } from '@nestjs/common';
import { GetUsersQueryDto, UserDto } from './dtos';
import { User } from './entities';
import { FindOptionsWhere } from 'typeorm';
import { PostgresErrorCode } from 'src/database/postgres-error-code';
import { createHash } from 'src/common/utils/hash';
import { Cron } from '@nestjs/schedule';
import { UsersRepository } from './users.repository';
import { isDatabaseError } from 'src/database/database-error';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  // every day at midnight Moscow
  @Cron('0 0 * * *', { timeZone: 'Europe/Moscow' })
  private async deleteSoftDeletedUsers() {
    const oneWeekAgo = "now() - interval '7 days'";
    await this.usersRepository.deleteSoftDeletedUsers(oneWeekAgo);
  }

  async saveUser(userDto: UserDto) {
    try {
      const { password } = userDto;
      const hashedPassword = await createHash(password);
      // Creating user entity to use beforeInsert method
      const user = this.usersRepository.create({
        ...userDto,
        password: hashedPassword,
      });
      const { id } = await this.usersRepository.save(user);
      return id;
    } catch (err) {
      if (
        isDatabaseError(err) &&
        err.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException(`Username or email already exists!`);
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Unhandled error when saving user: ${message}`, {
        cause: err,
      });
    }
  }

  async findOneBy(opts: FindOptionsWhere<User>) {
    return await this.usersRepository.findOneBy(opts);
  }

  async findAll(getUsersQueryDto: GetUsersQueryDto) {
    const users = await this.usersRepository.findAll(getUsersQueryDto);

    const { cursor, limit, isPrevious } = getUsersQueryDto;

    const hasMore = users.length > limit;
    if (hasMore) {
      users.pop();
    }

    const data = isPrevious ? users.reverse() : users;

    let nextCursor: string | undefined;
    let prevCursor: string | undefined;
    if (isPrevious) {
      prevCursor = hasMore ? data[0]?.id : undefined;
      nextCursor = data.at(-1)?.id;
    } else {
      nextCursor = hasMore ? data.at(-1)?.id : undefined;
      prevCursor = cursor && data.at(0)?.id;
    }

    return {
      data,
      nextCursor,
      prevCursor,
    };
  }

  async lockUserForUpdate(userId: string) {
    await this.usersRepository.lockUserForUpdate(userId);
  }

  async updateUser(userId: string, userDto: UserDto) {
    try {
      const { password } = userDto;
      const hashedPassword = await createHash(password);
      await this.usersRepository.save({
        ...userDto,
        id: userId,
        password: hashedPassword,
      });
    } catch (err) {
      if (
        isDatabaseError(err) &&
        err.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException(
          `Username ${userDto.username} already exists!`,
        );
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Unhandled error when updating user: ${message}`, {
        cause: err,
      });
    }
  }

  async deleteUser(userId: string) {
    await this.usersRepository.softDeleteUser(userId);
  }
}
