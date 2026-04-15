import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { AvatarsModule } from './avatars';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    UsersModule,
    AvatarsModule,
    RouterModule.register([
      {
        path: 'users',
        module: UsersModule,
        children: [AvatarsModule],
      },
    ]),
  ],
})
export class UsersRouterModule {}
