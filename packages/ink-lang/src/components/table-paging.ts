/** The rows of one page of a table: `start` inclusive, `end` exclusive. */
export interface PageBounds {
  page: number;
  pageCount: number;
  start: number;
  end: number;
}

/** The bounds of `page` over `rowCount` rows; a page past either end is clamped. */
export function pageBounds(rowCount: number, pageSize: number, page: number): PageBounds {
  const size = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(rowCount / size));
  let current = page;
  if (current < 0) current = 0;
  if (current > pageCount - 1) current = pageCount - 1;
  const start = current * size;
  const end = Math.min(rowCount, start + size);
  return { page: current, pageCount, start, end };
}

/** The footer text under a paged table, counting rows from one. */
export function pageSummary(bounds: PageBounds, rowCount: number): string {
  const first = rowCount === 0 ? 0 : bounds.start + 1;
  return `rows ${String(first)}-${String(bounds.end)} of ${String(rowCount)}`;
}
