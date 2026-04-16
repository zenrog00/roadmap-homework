export const BALANCE_OPERATION_TYPES = [
  'deposit',
  'withdrawal',
  'transfer',
] as const;

export type BalanceOperationType = (typeof BALANCE_OPERATION_TYPES)[number];
