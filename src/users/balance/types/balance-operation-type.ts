export const BALANCE_OPERATION = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRANSFER: 'transfer',
} as const;

export type BalanceOperation =
  (typeof BALANCE_OPERATION)[keyof typeof BALANCE_OPERATION];
