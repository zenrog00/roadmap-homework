import { BadRequestException, Injectable } from '@nestjs/common';
import { GetUsersQueryDto, UserDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PostgresErrorCode } from 'src/database/postgres-error-code';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async saveUser(userDto: UserDto) {
    try {
      // Creating user entity to use beforeInsert method
      const user = this.usersRepository.create(userDto);
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

  async findAll({ username, cursor, limit }: GetUsersQueryDto) {
    const queryBuilder = this.usersRepository.createQueryBuilder();
    if (username) {
      queryBuilder.where('username = :username', { username });
    }
    if (cursor) {
      queryBuilder.where('id < :cursor', { cursor });
    }

    const users = await queryBuilder
      .orderBy('id', 'DESC')
      .limit(limit + 1)
      .getMany();

    let nextCursor: string | undefined;
    const hasNextPage = users.length > limit;
    if (hasNextPage) {
      users.pop();
      nextCursor = users.at(-1)?.id;
    }

    return {
      data: users,
      nextCursor,
    };
  }

  async lockUserForUpdate(userId: string) {
    await this.usersRepository
      .createQueryBuilder()
      .setLock('pessimistic_write')
      .where('id = :userId', { userId })
      .getOne();
  }
}
