import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { RefreshSession } from './entities';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshSessionsRepository extends Repository<RefreshSession> {
  constructor(private readonly dataSource: DataSource) {
    super(RefreshSession, dataSource.createEntityManager());
  }

  // reimplementing parent class findOneBy to use innerJoin instead of leftJoin
  async findOneBy(opts: FindOptionsWhere<RefreshSession>) {
    return await this.createQueryBuilder('session')
      .innerJoinAndSelect('session.user', 'user')
      .where(opts)
      .getOne();
  }

  async countActive(userId: string) {
    return await this.createQueryBuilder('session')
      .innerJoin('session.user', 'user')
      .where('session.userId = :userId', { userId })
      .andWhere('session.expiresAt > now()')
      .getCount();
  }

  async findEarliestActive(userId: string) {
    return await this.createQueryBuilder('session')
      .innerJoin('session.user', 'user')
      .where('session.userId = :userId', { userId })
      .andWhere('session.expiresAt > now()')
      .orderBy('session.createdAt', 'ASC')
      .limit(1)
      .getOne();
  }
}
