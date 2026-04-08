import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserAvatar } from '../entities';

@Injectable()
export class UsersAvatarsRepository extends Repository<UserAvatar> {
  constructor(private readonly dataSource: DataSource) {
    super(UserAvatar, dataSource.createEntityManager());
  }

  async countUserAvatars(userId: string) {
    return await this.createQueryBuilder('users_avatars')
      .where('users_avatars.userId = :userId', { userId })
      .getCount();
  }
}
