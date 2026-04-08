import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserAvatar } from '../entities';

@Injectable()
export class UsersAvatarsRepository extends Repository<UserAvatar> {
  constructor(private readonly dataSource: DataSource) {
    super(UserAvatar, dataSource.createEntityManager());
  }
}
