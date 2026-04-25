import type { BalanceOperation } from './balance-operation-type';

export type ApplyIdempotentBalanceOperationInput = {
  userId: string;
  counterpartyUserId: string;
  idempotencyKey: string;
  operationType: BalanceOperation;
  amount: string;
};
