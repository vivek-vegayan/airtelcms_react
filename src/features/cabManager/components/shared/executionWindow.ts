import dayjs, { type Dayjs } from "dayjs";

/**
 * The CAB queue's execution window arrives as display text,
 * "DD-MM-YYYY HH:mm - HH:mm" (e.g. "01-11-2026 14:10 - 16:50"), or null when
 * the CRQ has no window yet. Filtering and sorting need real times, so this
 * reads them back out of the string.
 */
export interface ParsedExecutionWindow {
  /** Midnight of the window's date. */
  day: Dayjs;
  start: Dayjs;
  end: Dayjs;
}

const WINDOW_RE = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/;

export function parseExecutionWindow(value: string | null | undefined): ParsedExecutionWindow | null {
  const m = value ? WINDOW_RE.exec(value.trim()) : null;
  if (!m) return null;
  const [, dd, mm, yyyy, sh, sm, eh, em] = m;
  const day = dayjs(new Date(Number(yyyy), Number(mm) - 1, Number(dd)));
  if (!day.isValid()) return null;
  const start = day.hour(Number(sh)).minute(Number(sm));
  let end = day.hour(Number(eh)).minute(Number(em));
  // "22:00 - 02:00" runs past midnight into the next day.
  if (end.isBefore(start)) end = end.add(1, "day");
  return { day, start, end };
}

/** True once the window's end time has passed. */
export function isWindowOverdue(w: ParsedExecutionWindow | null, now: Dayjs = dayjs()): boolean {
  return w != null && w.end.isBefore(now);
}
