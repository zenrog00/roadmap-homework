import { Module } from '@nestjs/common';
import { UsersModule } from '../users.module';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { User } from '../entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UsersModule],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
