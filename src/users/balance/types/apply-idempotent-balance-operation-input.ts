import type { BalanceOperationType } from './balance-operation-type';

export type ApplyIdempotentBalanceOperationInput = {
  userId: string;
  idempotencyKey: string;
  operationType: BalanceOperationType;
  amount: string;
};
