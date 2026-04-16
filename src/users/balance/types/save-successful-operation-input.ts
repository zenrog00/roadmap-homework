import type { BalanceOperationType } from './balance-operation-type';

export type SaveSuccessfulOperationInput = {
  userId: string;
  counterpartyUserId: string;
  idempotencyKey: string;
  operationType: BalanceOperationType;
  amount: string;
  resultBalance: string;
};
