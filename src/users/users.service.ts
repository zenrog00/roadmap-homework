import { BadRequestException, Injectable } from '@nestjs/common';
import { GetUsersQueryDto, UserDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PostgresErrorCode } from 'src/database/postgres-error-code';
import { createHash } from 'src/common/utils/hash';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (err?.code === PostgresErrorCode.UniqueViolation) {
        throw new BadRequestException(
          `Username ${userDto.username} already exists!`,
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(`Unhandled error when saving user: ${err?.message}`, {
        cause: err,
      });
    }
  }

  async findOneBy(opts: FindOptionsWhere<User>) {
    return await this.usersRepository.findOneBy(opts);
  }

  async findAll({ username, cursor, limit, isPrevious }: GetUsersQueryDto) {
    const queryBuilder = this.usersRepository.createQueryBuilder();
    if (username) {
      queryBuilder.where('username = :username', { username });
    }
    if (cursor) {
      const operator = isPrevious ? '>' : '<';
      queryBuilder.andWhere(`id ${operator} :cursor`, { cursor });
    }

    const users = await queryBuilder
      .orderBy('id', isPrevious ? 'ASC' : 'DESC')
      .limit(limit + 1)
      .getMany();

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
    await this.usersRepository
      .createQueryBuilder()
      .setLock('pessimistic_write')
      .where('id = :userId', { userId })
      .getOne();
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (err?.code === PostgresErrorCode.UniqueViolation) {
        throw new BadRequestException(
          `Username ${userDto.username} already exists!`,
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(`Unhandled error when updating user: ${err?.message}`, {
        cause: err,
      });
    }
  }

  async deleteUser(userId: string) {
    await this.usersRepository.softDelete(userId);
  }

  // every day at midnight Moscow
  @Cron('0 0 * * *', { timeZone: 'Europe/Moscow' })
  private async deleteSoftDeletedUsers() {
    const oneWeekAgo = "now() - interval '7 days'";
    await this.usersRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('"deletedAt" is not null')
      .andWhere(`"deletedAt" <= ${oneWeekAgo}`)
      .execute();
  }
}
