import type { BalanceOperation } from './balance-operation-type';

export type SaveSuccessfulOperationInput = {
  userId: string;
  counterpartyUserId: string;
  idempotencyKey: string;
  operationType: BalanceOperation;
  amount: string;
  resultBalance: string;
};
