import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities';
import { DataSource } from 'typeorm';
import { GetMostActiveUsersQueryDto, GetUsersQueryDto } from './dtos';
import { MostActiveUsersResponseDto } from './dtos/get-most-active-users-response.dto';

@Injectable()
export class UsersRepository extends Repository<User> {
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findAll({ username, cursor, limit, isPrevious }: GetUsersQueryDto) {
    const queryBuilder = this.createQueryBuilder('user').select([
      'user.id',
      'user.username',
      'user.email',
      'user.birthdate',
      'user.description',
    ]);

    if (username) {
      queryBuilder.where('user.username = :username', { username });
    }
    if (cursor) {
      const operator = isPrevious ? '>' : '<';
      queryBuilder.andWhere(`user.id ${operator} :cursor`, { cursor });
    }
    return await queryBuilder
      .orderBy('user.id', isPrevious ? 'ASC' : 'DESC')
      .limit(limit + 1)
      .getMany();
  }

  async findMostActive({
    ageTo,
    ageFrom,
    limit,
    cursor,
    isPrevious,
  }: GetMostActiveUsersQueryDto): Promise<MostActiveUsersResponseDto[]> {
    // Latest active avatar per user (one row per userId)
    const latestAvatarSubQuery = this.manager
      .createQueryBuilder()
      .subQuery()
      .distinctOn(['ua."userId"'])
      .select('ua."userId"', 'userId')
      .addSelect('a.id', 'avatarId')
      .addSelect('a."createdAt"', 'avatarCreatedAt')
      .from('users_avatars', 'ua')
      .innerJoin('avatars', 'a', 'a.id = ua."avatarId"')
      .where('a."deletedAt" IS NULL')
      .orderBy('ua."userId"', 'ASC')
      .addOrderBy('a."createdAt"', 'DESC')
      .addOrderBy('a.id', 'DESC')
      .getQuery();

    const queryBuilder = this.createQueryBuilder('user')
      .select('user.id', 'id')
      .addSelect('user.username', 'username')
      .addSelect('user.email', 'email')
      .addSelect('user.birthdate', 'birthdate')
      .addSelect('user.description', 'description')
      .addSelect('la."avatarId"', 'lastAvatarId')
      .addSelect('la."avatarCreatedAt"', 'lastAvatarCreatedAt')
      .innerJoin(
        '(' + latestAvatarSubQuery + ')',
        'la',
        'la."userId" = user.id',
      )
      // Users with more than two *active* avatars
      .innerJoin(
        (subQuery) =>
          subQuery
            .select('ua2."userId"', 'userId')
            .from('users_avatars', 'ua2')
            .innerJoin('avatars', 'a2', 'a2.id = ua2."avatarId"')
            .where('a2."deletedAt" IS NULL')
            .groupBy('ua2."userId"')
            .having('COUNT(*) > 2'),
        'ac',
        'ac."userId" = user.id',
      )
      .where('user.description IS NOT NULL')
      .andWhere(`TRIM(user.description) <> ''`);

    if (ageFrom !== undefined) {
      queryBuilder.andWhere(
        `date_part('year', age(current_date, user.birthdate)) >= :ageFrom`,
        { ageFrom },
      );
    }
    if (ageTo !== undefined) {
      queryBuilder.andWhere(
        `date_part('year', age(current_date, user.birthdate)) <= :ageTo`,
        { ageTo },
      );
    }
    if (cursor) {
      const operator = isPrevious ? '>' : '<';
      queryBuilder.andWhere(`user.id ${operator} :cursor`, { cursor });
    }
    return await queryBuilder
      .orderBy('user.id', isPrevious ? 'ASC' : 'DESC')
      .limit(limit + 1)
      .getRawMany<MostActiveUsersResponseDto>();
  }

  async lockUserForUpdate(userId: string) {
    await this.createQueryBuilder()
      .setLock('pessimistic_write')
      .where('id = :userId', { userId })
      .getOne();
  }

  async softDeleteUser(userId: string) {
    await this.createQueryBuilder()
      .softDelete()
      .from(User)
      .where('id = :userId', { userId })
      .andWhere('deletedAt IS NULL')
      .execute();
  }

  async findUserIdsBatch(limit: number, cursor?: string) {
    const qb = this.createQueryBuilder('user').select('user.id');

    if (cursor) {
      qb.where('user.id > :afterCursor', { cursor });
    }

    return await qb.orderBy('user.id', 'ASC').limit(limit).getMany();
  }

  async deleteSoftDeletedUsers(to: string) {
    await this.createQueryBuilder()
      .delete()
      .where('"deletedAt" is not null')
      .andWhere(`"deletedAt" <= ${to}`)
      .execute();
  }
}
