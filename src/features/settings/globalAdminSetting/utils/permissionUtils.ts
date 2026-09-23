/** Convert a display label into an UPPER_SNAKE_CASE slug key. */
export const slug = (s: string): string =>
  s
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/, "");

/** Convert an UPPER_SNAKE_CASE code into a human-readable label ("Sub Approve"). */
export function humanizeCode(code: string): string {
  return code
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Extract a human-readable message from an RTK-Query / fetch error object. */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "data" in err &&
    (err as { data?: { message?: unknown } }).data &&
    typeof (err as { data: { message?: unknown } }).data.message === "string"
  ) {
    return (err as { data: { message: string } }).data.message;
  }
  return fallback;
}

/** Extract the HTTP status code from an RTK-Query error object (if present). */
export function extractErrorStatus(err: unknown): number | null {
  if (
    err &&
    typeof err === "object" &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
  ) {
    return (err as { status: number }).status;
  }
  return null;
}
