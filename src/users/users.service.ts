import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { GetMostActiveUsersQueryDto, GetUsersQueryDto, UserDto } from './dtos';
import { User } from './entities';
import { FindOptionsWhere } from 'typeorm';
import { PostgresErrorCode } from 'src/database/postgres-error-code';
import { createHash } from 'src/common/utils/hash';
import { Cron } from '@nestjs/schedule';
import { UsersRepository } from './users.repository';
import { isDatabaseError } from 'src/database/database-error';
import { buildCursorPaginationResult } from 'src/common/utils/cursor-pagination/cursor-pagination';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly cachePrefix = 'users';
  private readonly cacheTtl = 30 * 1000; // 30 seconds

  constructor(
    private readonly usersRepository: UsersRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // every day at 01:00 Moscow
  @Cron('0 1 * * *', { timeZone: 'Europe/Moscow' })
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

      await this.saveUserToCache(user);

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
    const cache = await this.getUserFromCache(opts);
    if (cache) {
      return cache;
    }

    const user = await this.usersRepository.findOneBy(opts);
    if (user) {
      await this.saveUserToCache(user);
    }

    return user;
  }

  async findAll(getUsersQueryDto: GetUsersQueryDto) {
    const users = await this.usersRepository.findAll(getUsersQueryDto);

    const { cursor, limit, isPrevious } = getUsersQueryDto;
    return buildCursorPaginationResult(users, {
      limit,
      cursor,
      isPrevious,
      getCursor: (user) => user.id,
    });
  }

  async findMostActive(getMostActiveUsersQueryDto: GetMostActiveUsersQueryDto) {
    const mostActiveUsers = await this.usersRepository.findMostActive(
      getMostActiveUsersQueryDto,
    );

    const { cursor, limit, isPrevious } = getMostActiveUsersQueryDto;
    return buildCursorPaginationResult(mostActiveUsers, {
      limit,
      cursor,
      isPrevious,
      getCursor: (user) => user.id,
    });
  }

  async findUserIdsBatch(limit: number, cursor?: string) {
    return this.usersRepository.findUserIdsBatch(limit, cursor);
  }

  async lockUserForUpdate(userId: string) {
    await this.usersRepository.lockUserForUpdate(userId);
  }

  async updateUser(userId: string, userDto: UserDto) {
    try {
      const { password } = userDto;
      const hashedPassword = await createHash(password);
      const savedUser = await this.usersRepository.save({
        ...userDto,
        id: userId,
        password: hashedPassword,
      });

      await this.saveUserToCache(savedUser);
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
    await this.invalidateUserCache(userId);
  }

  private async getUserFromCache(
    user: string | FindOptionsWhere<User>,
  ): Promise<User | undefined> {
    let userId: string;

    if (typeof user === 'string') {
      userId = user;
    } else if ('id' in user && typeof user.id === 'string') {
      userId = user.id;
    } else {
      return;
    }

    const key = this.buildUserCacheKey(userId);
    return await this.cacheManager.get(key);
  }

  private async saveUserToCache(user: User) {
    const key = this.buildUserCacheKey(user.id);
    await this.cacheManager.set(key, user, this.cacheTtl);
  }

  private async invalidateUserCache(userId: string) {
    const key = this.buildUserCacheKey(userId);
    await this.cacheManager.del(key);
  }

  private buildUserCacheKey(userId: string) {
    return `${this.cachePrefix}/${userId}`;
  }
}
