import {
  CursorPaginationQueryDto,
  CursorPaginationResponseDto,
} from './cursor-pagination.dto';

export type CursorPaginationOptions<T> = CursorPaginationQueryDto & {
  getCursor: (item: T) => string;
};

export type CursorPaginationResult<T> = CursorPaginationResponseDto & {
  data: T[];
};

export function buildCursorPaginationResult<T>(
  items: T[],
  { limit, cursor, isPrevious, getCursor }: CursorPaginationOptions<T>,
): CursorPaginationResult<T> {
  const hasMore = items.length > limit;
  const trimmedItems = hasMore ? items.slice(0, limit) : items;
  const data = isPrevious ? [...trimmedItems].reverse() : trimmedItems;

  let nextCursor: string | undefined;
  let prevCursor: string | undefined;

  if (isPrevious) {
    prevCursor = hasMore ? getCursor(data[0]) : undefined;
    nextCursor = data.length > 0 ? getCursor(data[data.length - 1]) : undefined;
  } else {
    nextCursor =
      hasMore && data.length > 0 ? getCursor(data[data.length - 1]) : undefined;
    prevCursor = cursor && data.length > 0 ? getCursor(data[0]) : undefined;
  }

  return {
    data,
    nextCursor,
    prevCursor,
  };
}
