import { useCallback, useEffect, useRef, useState } from "react";

interface AutoFitOptions {
  /** Never shrink past this — below it the canvas scrolls instead of becoming unreadable. */
  min?: number;
  /** Never grow past this, so a 4K monitor doesn't blow the diagram up. */
  max?: number;
  /**
   * Design-space height. Supply it and the scale also fits whatever viewport
   * height is left below the canvas, so the whole diagram reads in one view
   * instead of running under the fold.
   */
  baseHeight?: number;
  /**
   * Breathing room between the fitted canvas and the viewport bottom. This has
   * to cover the chrome drawn *below* the measured node too (card padding,
   * borders, the page's own bottom padding) — fit it flush and the page
   * overflows by those few pixels, which is precisely what summons the
   * scrollbar this hook then has to fight.
   */
  bottomGutter?: number;
  /** Don't height-fit into a slot smaller than this — scrolling beats a speck. */
  minViewportSlot?: number;
}

/**
 * Widest scrollbar we expect an ancestor to take away from us, in CSS px
 * (classic Windows is 17; overlay/thin ones are far less). Used as the size of
 * the deadband below — see `measure`.
 */
const SCROLLBAR_ALLOWANCE = 24;

/** Scale steps, so sub-pixel container jitter can't produce a new value at all. */
const STEP = 0.005;

/**
 * Total vertical scroll displacement applied to `node` by its ancestors.
 *
 * Summed rather than taken from "the" scroll parent because the shell nests
 * several `overflow: auto` boxes, only one of which is actually scrolling at
 * any moment; non-scrolling ancestors contribute 0, so the sum is exact.
 */
const scrollOffsetOf = (node: HTMLElement): number => {
  let total = window.scrollY || 0;
  let el: HTMLElement | null = node.parentElement;
  while (el) {
    total += el.scrollTop;
    el = el.parentElement;
  }
  return total;
};

/**
 * Scales a fixed-coordinate canvas to fit its container.
 *
 * The flow diagram is drawn once at its design size (cards + SVG connectors
 * share one coordinate space, so they can't drift); this hook is what makes
 * that fixed drawing responsive. Width alone used to drive the scale, which
 * meant a tall CRQ still spilled past the bottom of the screen — so when
 * `baseHeight` is given the scale is the tighter of the two fits.
 *
 * Both measurements are deliberately taken from things the canvas's own size
 * cannot change, because this hook's output *is* the canvas's size: anything
 * that reads back downstream of the scale is a feedback loop, and a feedback
 * loop here shows up as a diagram that visibly flickers between two sizes
 * forever. See `measure` for the two that used to exist.
 */
export const useAutoFitScale = (
  baseWidth: number,
  {
    min = 0.58,
    max = 1.12,
    baseHeight,
    bottomGutter = 44,
    minViewportSlot = 240,
  }: AutoFitOptions = {}
) => {
  const [{ scale, widthFloored }, setFit] = useState({ scale: 1, widthFloored: false });
  const elRef = useRef<HTMLDivElement | null>(null);
  /**
   * Set whenever something genuinely changed — first measurement, a viewport
   * resize, a different diagram — so that measurement is applied exactly
   * instead of being filtered by the deadband.
   */
  const exactRef = useRef(true);

  const measure = useCallback(() => {
    const node = elRef.current;
    if (!node) return;

    const width = node.clientWidth;
    if (!width) return;

    const widthRatio = width / baseWidth;
    let ratio = widthRatio;

    if (baseHeight) {
      // Where the canvas sits with the page at rest. Reading the live rect top
      // (as this used to) folds in how far the user has scrolled, so the same
      // window would fit to a different scale depending on scroll position.
      const restTop = node.getBoundingClientRect().top + scrollOffsetOf(node);
      const slot = window.innerHeight - restTop - bottomGutter;
      // Note this measures only what's ABOVE the canvas. Deriving the slot from
      // the canvas's own height — or from a container sized by it — would feed
      // the scale straight back into itself.
      if (slot >= minViewportSlot) ratio = Math.min(ratio, slot / baseHeight);
    }

    const clamped = Math.min(max, Math.max(min, ratio));
    const next = Math.round((Math.round(clamped / STEP) * STEP) * 1000) / 1000;
    // Horizontal scrolling is a width problem only — a height-driven floor must
    // not switch it on.
    const floored = widthRatio <= min;

    // ── Anti-flicker deadband ────────────────────────────────────────────────
    // A scrollbar appearing in an ancestor takes its own thickness off our
    // measured width and changes nothing else. Acted on, that closes a loop:
    // fit → taller canvas → page overflows → scrollbar → narrower container →
    // smaller fit → shorter canvas → no overflow → scrollbar goes → repeat.
    // It only bites at the window sizes where the page lands right on the
    // overflow boundary, which is why the diagram was rock-steady at one screen
    // size and strobing at the next. `noise` is how much of the scale a
    // scrollbar is worth, and re-growing by less than that is refused below. A
    // real resize clears it by an order of magnitude, and sets `exactRef`
    // besides.
    const noise = SCROLLBAR_ALLOWANCE / baseWidth;

    // Consumed here rather than inside the updater — updaters have to stay pure
    // (StrictMode calls them twice).
    const exact = exactRef.current;
    exactRef.current = false;

    setFit((prev) => {
      if (prev.scale === next && prev.widthFloored === floored) return prev;
      if (exact || prev.widthFloored !== floored) return { scale: next, widthFloored: floored };
      // Only *growth* is filtered. Shrinking always applies, so the diagram is
      // never left wider than the space it's in; growth has to clear more than
      // a scrollbar's worth, so re-gaining that width can't push it back out
      // again. Together those give the loop one direction and it settles after
      // a single correction instead of ringing.
      const delta = next - prev.scale;
      return delta > 0 && delta < noise * 1.5 ? prev : { scale: next, widthFloored: floored };
    });
  }, [baseWidth, baseHeight, min, max, bottomGutter, minViewportSlot]);

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      elRef.current = node;
      if (node) measure();
    },
    [measure]
  );

  // A different CRQ means a different design height — re-fit it exactly rather
  // than inheriting the previous diagram's scale through the deadband.
  useEffect(() => {
    exactRef.current = true;
  }, [baseWidth, baseHeight]);

  useEffect(() => {
    const node = elRef.current;
    if (!node) return;

    let frame = 0;
    // rAF-deferred so a scale change can never re-enter the observer in the
    // same frame ("ResizeObserver loop" warnings).
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const scheduleExact = () => {
      exactRef.current = true;
      schedule();
    };

    schedule();
    // A window resize is a real change of the space available, not jitter.
    window.addEventListener("resize", scheduleExact);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(schedule);
      observer.observe(node);
      // The chrome above the canvas (selector, info strip) reflows as data
      // lands, which moves the canvas down without resizing it — body catches
      // that, the node alone wouldn't. Safe to observe even though the canvas
      // contributes to body's height, because a measurement it can't influence
      // just resolves to the same scale and bails out of setState.
      if (document.body) observer.observe(document.body);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleExact);
      observer?.disconnect();
    };
  }, [measure]);

  return { ref, scale, isFloored: widthFloored };
};
