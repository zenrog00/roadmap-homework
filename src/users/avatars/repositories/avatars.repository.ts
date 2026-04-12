import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Avatar, UserAvatar } from '../entities';

export type SoftDeletedAvatarRow = Pick<UserAvatar, 'userId' | 'avatarId'>;

@Injectable()
export class AvatarsRepository extends Repository<Avatar> {
  constructor(private readonly dataSource: DataSource) {
    super(Avatar, dataSource.createEntityManager());
  }

  async softDeleteUserAvatar(userId: string, avatarId: string) {
    return await this.createQueryBuilder()
      .softDelete()
      .from(Avatar)
      .where('id = :avatarId', { avatarId })
      .andWhere('deletedAt IS NULL')
      .andWhere(
        `EXISTS (${this.manager
          .createQueryBuilder()
          .subQuery()
          .select('1')
          .from(UserAvatar, 'ua')
          .where('ua.userId = :userId', { userId })
          .andWhere('ua.avatarId = :avatarId', { avatarId })
          .getQuery()}
        )`,
      )
      .setParameters({ userId, avatarId })
      .execute();
  }

  async findSoftDeleted(untilDays: number, batchSize: number) {
    return await this.createQueryBuilder()
      .select('ua."userId"', 'userId')
      .addSelect('ua."avatarId"', 'avatarId')
      .from('users_avatars', 'ua')
      .innerJoin('avatars', 'a', 'ua."avatarId" = a.id')
      .where('a."deletedAt" IS NOT NULL')
      .andWhere(`a."deletedAt" <= NOW() - (:untilDays * INTERVAL '1 day')`, {
        untilDays,
      })
      .orderBy('a."deletedAt"', 'ASC')
      .limit(batchSize)
      .getRawMany<SoftDeletedAvatarRow>();
  }

  async deleteSoftDeletedAvatars(untilDays: number) {
    await this.createQueryBuilder()
      .delete()
      .where('"deletedAt" is not null')
      .andWhere(`a."deletedAt" <= NOW() - (:untilDays * INTERVAL '1 day')`, {
        untilDays,
      })
      .execute();
  }
}
