import { useCallback, useEffect, useRef, useState } from "react";

/**
 * How many table rows fit in the space left under a given element's top edge.
 *
 * The point is that "All users" arrives as one screenful — no inner scroll, no
 * half-cut final row — at whatever window size the person happens to have.
 *
 * ── Why it is written this way ────────────────────────────────────────────
 * CHM's shell nests several `overflow: auto` boxes and only `html` carries
 * `scrollbar-gutter: stable`, so any fit-to-container measurement that feeds
 * back into its own input can oscillate forever at boundary window sizes: the
 * content grows, a scrollbar appears, the container narrows, the content
 * shrinks, the scrollbar leaves, repeat. (See the CRQ journey canvas, which hit
 * exactly this.) Three rules keep this hook out of that loop:
 *
 *   1. It reads only `rect.top` — the height of the chrome *above* the table,
 *      which is upstream of the row count — plus `window.innerHeight`. It never
 *      reads the table's own height, or its container's.
 *   2. The row count changes what the table paints *inside* a `flex: 1`,
 *      internally-scrolling region, so it cannot change the page's own height
 *      and therefore cannot move `rect.top`. The output is not an input.
 *   3. A deadband: the fit has to move by more than a scrollbar's width of
 *      vertical slack before the count is allowed to change. Measurement is
 *      debounced to the end of a resize gesture, which also keeps the row count
 *      (a query parameter) from refetching per frame.
 */
export interface FitRowsOptions {
  /** Painted height of one body row, including its border. */
  rowHeight: number;
  /** Everything inside the table that is not a body row: toolbar + head. */
  chromeHeight: number;
  /** Space below the table that must stay visible (the pagination footer). */
  reservedBelow: number;
  min: number;
  max: number;
  /** Off while the user has chosen their own page size. */
  enabled: boolean;
}

/** Vertical slack tolerated before a re-fit — comfortably wider than any
 *  scrollbar, so a gutter appearing or leaving can never trigger a change. */
const DEADBAND_PX = 24;

export function useFitRows({
  rowHeight,
  chromeHeight,
  reservedBelow,
  min,
  max,
  enabled,
}: FitRowsOptions) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [rows, setRows] = useState<number | null>(null);
  // Remembers the space the current answer was computed for, so the deadband
  // compares against the last *accepted* measurement rather than the last seen.
  const settledSpaceRef = useRef<number | null>(null);

  // Latest config, read inside the observer callback so that changing density
  // does not have to tear the observer down and rebuild it.
  const configRef = useRef({ rowHeight, chromeHeight, reservedBelow, min, max, enabled });
  configRef.current = { rowHeight, chromeHeight, reservedBelow, min, max, enabled };

  const measure = useCallback(() => {
    const el = nodeRef.current;
    const cfg = configRef.current;
    if (!el || !cfg.enabled) return;

    const top = el.getBoundingClientRect().top;
    const available = window.innerHeight - top - cfg.reservedBelow - cfg.chromeHeight;

    const settled = settledSpaceRef.current;
    if (settled !== null && Math.abs(available - settled) < DEADBAND_PX) return;

    const next = Math.max(cfg.min, Math.min(cfg.max, Math.floor(available / cfg.rowHeight)));

    settledSpaceRef.current = available;
    setRows((prev) => (prev === next ? prev : next));
  }, []);

  const observerRef = useRef<ResizeObserver | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const schedule = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(measure, 180);
  }, [measure]);

  /**
   * Callback ref, not a plain one: the anchor is inside the branch that only
   * renders once the first page of data has arrived, so an effect that runs at
   * mount finds nothing to measure and never fires again. Attaching here means
   * the first measurement happens exactly when the element appears.
   */
  const anchorRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      nodeRef.current = node;
      if (!node) return;

      // Watching the anchor's own box is what tells us the chrome above it
      // moved (the summary strip being hidden, the filter bar wrapping). Its
      // height is set by `flex: 1` against the page, never by the row count,
      // so this is not a read of our own output.
      observerRef.current = new ResizeObserver(schedule);
      observerRef.current.observe(node);

      requestAnimationFrame(measure);
    },
    [measure, schedule],
  );

  // Re-fit when the geometry itself changes (a density switch), and clear the
  // settled baseline so the new row height is applied to the same space.
  useEffect(() => {
    settledSpaceRef.current = null;
    if (enabled) schedule();
  }, [enabled, rowHeight, chromeHeight, reservedBelow, min, max, schedule]);

  useEffect(() => {
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("resize", schedule);
      window.clearTimeout(timerRef.current);
      observerRef.current?.disconnect();
    };
  }, [schedule]);

  return { anchorRef, rows, remeasure: measure };
}
