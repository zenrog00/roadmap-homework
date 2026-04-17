import { Module } from '@nestjs/common';
import { UsersModule } from '../users.module';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { User } from '../entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceOperation } from './entities';
import { BalanceRepository, BalanceOperationsRepository } from './repositories';
import { BalanceResetController } from './balance-jobs-queue';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, BalanceOperation]),
    BullModule.registerQueue({
      name: 'balance',
    }),
    UsersModule,
  ],
  controllers: [BalanceController, BalanceResetController],
  providers: [BalanceService, BalanceRepository, BalanceOperationsRepository],
})
export class BalanceModule {}
