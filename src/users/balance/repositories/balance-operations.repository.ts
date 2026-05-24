import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BalanceOperation } from '../entities';

@Injectable()
export class BalanceOperationsRepository extends Repository<BalanceOperation> {
  constructor(private readonly dataSource: DataSource) {
    super(BalanceOperation, dataSource.createEntityManager());
  }

  async acquireIdempotencyLock(userId: string, idempotencyKey: string) {
    // using lock on custom key because we need to lock transaction
    // even if this combination does not exist yet
    await this.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `${userId}:${idempotencyKey}`,
    ]);
  }
}
