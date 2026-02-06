export function isRecord<K extends string | number | symbol = string, V = any>(
  value: unknown,
): value is Record<K, V> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
