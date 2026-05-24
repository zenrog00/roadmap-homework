import { isRecord } from 'src/common/utils/is-record';
import { PostgresErrorCode } from './postgres-error-code';

export interface DatabaseError {
  code: PostgresErrorCode;
  detail: string;
  table: string;
}

export function isDatabaseError(value: unknown): value is DatabaseError {
  if (!isRecord(value)) {
    return false;
  }
  const { code, detail, table } = value;
  return Boolean(code && detail && table);
}
