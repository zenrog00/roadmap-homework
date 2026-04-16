import type { BalanceOperationType } from './balance-operation-type';

export type ApplyIdempotentBalanceOperationInput = {
  userId: string;
  counterpartyUserId: string;
  idempotencyKey: string;
  operationType: BalanceOperationType;
  amount: string;
};
