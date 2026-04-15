import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { AvatarsModule } from './avatars';
import { RouterModule } from '@nestjs/core';
import { BalanceModule } from './balance';

@Module({
  imports: [
    UsersModule,
    AvatarsModule,
    RouterModule.register([
      {
        path: 'users',
        module: UsersModule,
        children: [AvatarsModule, BalanceModule],
      },
    ]),
  ],
})
export class UsersRouterModule {}
