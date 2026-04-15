export const BALANCE_OPERATION_TYPES = ['deposit', 'withdrawal'] as const;

export type BalanceOperationType = (typeof BALANCE_OPERATION_TYPES)[number];
