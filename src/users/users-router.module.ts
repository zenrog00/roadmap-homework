import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { AvatarsModule } from './avatars';
import { RouterModule } from '@nestjs/core';
import { BalanceModule } from './balance';
import { BalanceJobsQueueModule } from './balance/balance-jobs-queue';

@Module({
  imports: [
    UsersModule,
    AvatarsModule,
    BalanceModule,
    BalanceJobsQueueModule,
    RouterModule.register([
      {
        path: 'users',
        module: UsersModule,
        children: [AvatarsModule, BalanceModule, BalanceJobsQueueModule],
      },
    ]),
  ],
})
export class UsersRouterModule {}
