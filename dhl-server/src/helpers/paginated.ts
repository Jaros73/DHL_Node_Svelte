export function paginated<T>(
  items: T[],
  { limit, offset }: { limit?: number | undefined; offset?: number | undefined } = {},
) {
  let next = limit !== undefined && items.length === limit ? (offset ?? 0) + limit : undefined;

  return {
    items,
    next: next ? `${next}` : undefined,
  };
}
