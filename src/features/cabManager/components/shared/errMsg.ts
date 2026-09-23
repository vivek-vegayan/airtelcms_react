/** Extract a human message from an RTK Query error union. */
export function errMsg(error: unknown): string {
  if (!error) return "Something went wrong.";
  if (typeof error === "object" && error !== null) {
    const e = error as { data?: { message?: string }; message?: string; error?: string };
    return e.data?.message ?? e.message ?? e.error ?? "Request failed.";
  }
  return String(error);
}

/**
 * The CAB stored procedures signal "nothing matched your filters" by returning
 * an `error_message` column instead of an empty result set. DatabaseUtils turns
 * that column into a DatabaseOperationException and GlobalExceptionHandler maps
 * it to HTTP 500 — so a perfectly ordinary empty queue arrives at the UI looking
 * like a server failure, complete with a Retry button that can never help.
 *
 * These are the sentinel phrases the procs use for that case. Anything else that
 * comes back on the error channel is a real failure and must stay one.
 */
const EMPTY_RESULT_SENTINELS = [
  "no crqs found",
  "no crq found",
  "no records found",
  "no record found",
  "no data found",
  "no rows found",
  "no result found",
  "no results found",
];

/** True when an RTK Query error is really just "the filtered set is empty". */
export function isEmptyResultError(error: unknown): boolean {
  if (!error) return false;
  const message = errMsg(error).trim().toLowerCase().replace(/[.!]+$/, "");
  return EMPTY_RESULT_SENTINELS.some((sentinel) => message === sentinel);
}
