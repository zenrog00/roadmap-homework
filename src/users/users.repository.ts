import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities';
import { DataSource } from 'typeorm';
import { GetUsersQueryDto } from './dtos';

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
      .where('userId = :userId', { userId })
      .andWhere('deletedAt IS NULL')
      .execute();
  }

  async deleteSoftDeletedUsers(to: string) {
    await this.createQueryBuilder()
      .delete()
      .where('"deletedAt" is not null')
      .andWhere(`"deletedAt" <= ${to}`)
      .execute();
  }
}
