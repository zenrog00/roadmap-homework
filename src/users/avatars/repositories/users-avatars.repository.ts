import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserAvatar } from '../entities';
import { AvatarsListResponseDto } from '../dtos';

@Injectable()
export class UsersAvatarsRepository extends Repository<UserAvatar> {
  constructor(private readonly dataSource: DataSource) {
    super(UserAvatar, dataSource.createEntityManager());
  }

  async countUserAvatars(userId: string) {
    return await this.createQueryBuilder('ua')
      .where('ua.userId = :userId', { userId })
      .getCount();
  }

  async findAll(userId: string): Promise<AvatarsListResponseDto[]> {
    return await this.createQueryBuilder('ua')
      .innerJoin('ua.avatar', 'a')
      .select('ua.avatarId', 'id')
      .addSelect('a.createdAt', 'createdAt')
      .where('ua.userId = :userId', { userId })
      .orderBy('a.createdAt')
      .getRawMany();
  }
}
