import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Avatar } from '../entities';

@Injectable()
export class AvatarsRepository extends Repository<Avatar> {
  constructor(private readonly dataSource: DataSource) {
    super(Avatar, dataSource.createEntityManager());
  }
}
