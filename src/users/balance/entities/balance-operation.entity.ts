import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from 'src/users/entities';
import type { BalanceOperationType } from '../types';

@Entity({ name: 'balance_operations' })
@Check(`"operationType" in ('deposit', 'withdrawal', 'transfer')`)
@Check(`"amount" > 0`)
export class BalanceOperation {
  @PrimaryColumn('uuid')
  userId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @PrimaryColumn('uuid')
  idempotencyKey: string;

  @Column()
  operationType: BalanceOperationType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount: string;

  @Column('uuid')
  counterpartyUserId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'counterpartyUserId' })
  counterpartyUser: User;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  resultBalance: string;

  @Index()
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
