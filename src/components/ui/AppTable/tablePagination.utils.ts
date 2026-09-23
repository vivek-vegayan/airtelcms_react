/**
 * Rows-per-page options for every table in the app.
 *
 * This generalises the behaviour that the All CRQs page (`/cabmanager/allcrqs`)
 * had on its own: the standard ladder is always offered, and the real row
 * count is slotted into it in sorted position. A 13-row table therefore
 * offers `5, 10, 13, 15, 20, …`, so "show me everything" is always one click
 * away without the user having to guess which rung clears the table.
 */

/** The standard ladder, matching the All CRQs page it was lifted from. */
export const DEFAULT_PAGE_SIZES = [5, 10, 15, 20, 25, 30, 50, 100];

/**
 * No ceiling by default — the row count is offered however large it is, which
 * is what the reference page did. Screens backed by genuinely unbounded data
 * can pass `allOptionMaxRows` to stop offering a page that would render tens
 * of thousands of rows at once.
 */
export const DEFAULT_ALL_OPTION_MAX_ROWS = Number.POSITIVE_INFINITY;

export interface RowsPerPageConfig {
  /** Ladder offered before the row count is merged in. */
  pageSizes?: number[];
  /** Set false to keep the plain ladder with no row-count entry. */
  showAllOption?: boolean;
  /** Ceiling past which the row count is not offered. Unlimited by default. */
  allOptionMaxRows?: number;
  /**
   * The page size currently in state. It is always present in the returned
   * list — a `Select` whose value is absent from its options renders blank
   * and warns, which is easy to hit when a filter shrinks the row count
   * below the active page size.
   */
  currentPageSize?: number;
}

/**
 * Builds the option list for a table's rows-per-page control.
 *
 * `totalRowCount` is the number of rows the user could page through right
 * now — the filtered count for client-side tables, the server's reported
 * total for manually paginated ones.
 */
export function buildRowsPerPageOptions(
  totalRowCount: number | null | undefined,
  config: RowsPerPageConfig = {},
): number[] {
  const {
    pageSizes = DEFAULT_PAGE_SIZES,
    showAllOption = true,
    allOptionMaxRows = DEFAULT_ALL_OPTION_MAX_ROWS,
    currentPageSize,
  } = config;

  const total = typeof totalRowCount === "number" ? totalRowCount : 0;
  // Rungs at or above the row count all show the same single page, so only
  // the ones below it are kept — the row count itself stands in for them
  // (added below). Without that entry (showAllOption false, e.g. a server
  // table with no known total) the full ladder is kept.
  const trim = showAllOption && total > 0 && total <= allOptionMaxRows;
  const options = new Set(pageSizes.filter((n) => n > 0 && (!trim || n < total)));

  if (showAllOption && total > 0 && total <= allOptionMaxRows) {
    options.add(total);
  }
  if (currentPageSize && currentPageSize > 0) {
    options.add(currentPageSize);
  }

  return [...options].sort((a, b) => a - b);
}
