import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserAvatar } from '../entities';
import { AvatarsListResponseDto } from '../dtos';

@Injectable()
export class UsersAvatarsRepository extends Repository<UserAvatar> {
  constructor(private readonly dataSource: DataSource) {
    super(UserAvatar, dataSource.createEntityManager());
  }

  async countUserAvatars(userId: string, avatarId?: string) {
    const queryBuilder = this.createQueryBuilder('ua')
      .innerJoin('ua.avatar', 'a')
      .where('ua.userId = :userId', { userId })
      .andWhere('a.deletedAt IS NULL');

    if (avatarId) {
      queryBuilder.andWhere('ua.avatarId = :avatarId', { avatarId });
    }

    return await queryBuilder.getCount();
  }

  async findAll(userId: string): Promise<AvatarsListResponseDto[]> {
    return await this.createQueryBuilder('ua')
      .innerJoin('ua.avatar', 'a')
      .select('ua.avatarId', 'id')
      .addSelect('a.createdAt', 'createdAt')
      .where('ua.userId = :userId', { userId })
      .andWhere('a.deletedAt IS NULL')
      .orderBy('a.createdAt')
      .getRawMany();
  }
}
