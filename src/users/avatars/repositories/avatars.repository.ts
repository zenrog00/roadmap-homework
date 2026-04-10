import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Avatar, UserAvatar } from '../entities';

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
}
