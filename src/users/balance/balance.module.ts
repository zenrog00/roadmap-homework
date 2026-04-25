import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users.module';
import { User } from '../entities';
import { BalanceOperation } from './entities';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { BalanceRepository, BalanceOperationsRepository } from './repositories';

@Module({
  imports: [TypeOrmModule.forFeature([User, BalanceOperation]), UsersModule],
  controllers: [BalanceController],
  providers: [BalanceService, BalanceRepository, BalanceOperationsRepository],
  exports: [BalanceService, BalanceRepository, BalanceOperationsRepository],
})
export class BalanceModule {}
