import { Chart as ChartJS, type BarElement, type Plugin } from "chart.js";
import { fmtN } from "./p1Format";

/*
 * Exact counts written on the bars, so users read them without hovering; hover still has the
 * detail. Numbers are never abbreviated. Placement:
 *   1. one orientation per chart, as Excel / Power BI do: labels sit horizontally above their bars,
 *      unless any of them is wider than its bar - then every label on the chart is turned
 *      vertical (90°), which needs only one line height in width and fits thin bars;
 *   2. a label that would still overlap another one is left to the hover tooltip;
 *   4. the largest values are placed first, so the numbers that matter are never the ones dropped.
 * Stacked charts place their totals first; a segment shows its own count inside the block only
 * when it fits there and its colour leaves the text readable.
 */

const FONT_SIZE = 11;
const PAD = 2; // clear space kept around every label
const GAP = 3; // between a bar top and its label
const font = () => `600 ${FONT_SIZE}px ${ChartJS.defaults.font.family ?? "system-ui, sans-serif"}`;

/** Readable text colour on a #rrggbb fill, or null when the fill is not a plain hex colour. */
function textOn(fill: unknown): string | null {
  if (typeof fill !== "string") return null;
  const m = /^#([0-9a-f]{6})$/i.exec(fill.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return lum > 0.4 ? "#14171C" : "#FFFFFF";
}

interface BarBox {
  x: number;
  y: number;
  base: number;
  width: number;
}
export interface Rect {
  l: number;
  r: number;
  t: number;
  b: number;
}

/** Where a drawn label sits and which bar it belongs to, so a click on the label opens that bar. */
export interface LabelHit {
  rect: Rect;
  datasetIndex: number;
  index: number;
}

/** The label hit areas of each chart, refreshed on every draw. */
export const labelHits = new WeakMap<object, LabelHit[]>();

/** The bar whose label is under the point (canvas pixels), if any. */
export function labelAt(chart: object, x: number, y: number): LabelHit | undefined {
  return labelHits.get(chart)?.find((h) => x >= h.rect.l && x <= h.rect.r && y >= h.rect.t && y <= h.rect.b);
}

const boxOf = (el: BarElement): BarBox => el.getProps(["x", "y", "base", "width"], true) as unknown as BarBox;
const overlaps = (a: Rect, b: Rect) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

/** A label waiting to be placed: above a bar or stack ("top"), or centred in a stacked segment ("inside"). */
interface Candidate {
  value: number;
  x: number;
  /** "top": the bar's top edge; "inside": the segment's vertical middle. */
  y: number;
  kind: "top" | "inside";
  color: string;
  /** Inside labels must stay within their segment. */
  boxWidth?: number;
  boxHeight?: number;
  /** Width of the bar (or stack) under a "top" label. */
  barWidth?: number;
  /** The bar this label belongs to; a stacked total has none (it covers several series). */
  datasetIndex?: number;
  index: number;
}

export function barValueLabels(opts: { stacked: boolean; textColor: string }): Plugin<"bar"> {
  return {
    id: "p1BarValueLabels",
    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      const metas = chart.getSortedVisibleDatasetMetas();
      const valueAt = (datasetIndex: number, i: number) => Number(chart.data.datasets[datasetIndex]?.data[i]) || 0;
      const tops: Candidate[] = [];
      const insides: Candidate[] = [];

      if (!opts.stacked) {
        metas.forEach((meta) =>
          meta.data.forEach((el, i) => {
            const v = valueAt(meta.index, i);
            if (!v) return;
            const b = boxOf(el as BarElement);
            tops.push({ value: v, x: b.x, y: b.y, kind: "top", color: opts.textColor, barWidth: b.width, datasetIndex: meta.index, index: i });
          }),
        );
      } else {
        const count = chart.data.labels?.length ?? 0;
        for (let i = 0; i < count; i++) {
          let total = 0;
          let top = Infinity;
          let x = 0;
          let width = 0;
          metas.forEach((meta) => {
            const v = valueAt(meta.index, i);
            const el = meta.data[i] as BarElement | undefined;
            if (!v || !el) return;
            const b = boxOf(el);
            total += v;
            top = Math.min(top, b.y);
            x = b.x;
            width = b.width;
            const color = metas.length > 1 ? textOn(chart.data.datasets[meta.index]?.backgroundColor) : null;
            if (color) {
              insides.push({
                value: v,
                x: b.x,
                y: (b.y + b.base) / 2,
                kind: "inside",
                color,
                boxWidth: b.width,
                boxHeight: Math.abs(b.base - b.y),
                datasetIndex: meta.index,
                index: i,
              });
            }
          });
          if (total) tops.push({ value: total, x, y: top, kind: "top", color: opts.textColor, barWidth: width, index: i });
        }
      }

      ctx.save();
      ctx.font = font();
      const placed: Rect[] = [];
      const hits: LabelHit[] = [];
      const free = (rect: Rect) => rect.t >= 0 && !placed.some((p) => overlaps(p, rect));

      // A label that would stick out past the left or right edge of the plot (the first bar beside
      // the y axis, the last bar on the right) is moved inward just enough to stay inside, instead of
      // being dropped. It stays above its own bar, only no longer exactly centred.
      const EDGE = 4;
      const nudge = (rect: Rect) => {
        if (rect.l < chartArea.left - EDGE) return chartArea.left - EDGE - rect.l;
        if (rect.r > chartArea.right + EDGE) return chartArea.right + EDGE - rect.r;
        return 0;
      };

      const draw = (c: Candidate, x: number, text: string, vertical: boolean) => {
        ctx.save();
        ctx.fillStyle = c.color;
        if (c.kind === "top") {
          ctx.translate(x, c.y - GAP);
          if (vertical) ctx.rotate(-Math.PI / 2);
          ctx.textAlign = vertical ? "left" : "center";
          ctx.textBaseline = vertical ? "middle" : "bottom";
        } else {
          ctx.translate(x, c.y);
          if (vertical) ctx.rotate(-Math.PI / 2);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
        }
        ctx.fillText(text, 0, 0);
        ctx.restore();
      };

      // One orientation for every bar-top label of this chart.
      const topsVertical = tops.some((c) => ctx.measureText(fmtN(c.value)).width > (c.barWidth ?? 0) + 2);

      const tryPlace = (c: Candidate) => {
        const text = fmtN(c.value);
        const w = ctx.measureText(text).width;
        const orientations = c.kind === "top" ? [topsVertical] : [false, true];
        for (const vertical of orientations) {
          // the space the label takes: w x line height, or line height x w when vertical
          const across = vertical ? FONT_SIZE : w;
          const along = vertical ? w : FONT_SIZE;
          if (c.kind === "inside" && (across > (c.boxWidth ?? 0) - 4 || along > (c.boxHeight ?? 0) - 4)) continue;
          const yTop = c.kind === "top" ? c.y - GAP - along : c.y - along / 2;
          let rect: Rect = { l: c.x - across / 2 - PAD, r: c.x + across / 2 + PAD, t: yTop - PAD, b: yTop + along + PAD };
          // inside labels already sit within their segment; only labels above a bar can stick out
          const dx = c.kind === "top" ? nudge(rect) : 0;
          if (dx) rect = { ...rect, l: rect.l + dx, r: rect.r + dx };
          if (!free(rect)) continue;
          placed.push(rect);
          if (c.datasetIndex != null) hits.push({ rect, datasetIndex: c.datasetIndex, index: c.index });
          draw(c, c.x + dx, text, vertical);
          return;
        }
      };

      // Totals and bar tops first, biggest first; segment labels only fill the space left.
      [...tops].sort((a, b) => b.value - a.value).forEach(tryPlace);
      [...insides].sort((a, b) => b.value - a.value).forEach(tryPlace);
      labelHits.set(chart, hits);
      ctx.restore();
    },
  };
}

/** Category names under the axis wrap onto at most this many lines (the tooltip keeps the full name). */
const MAX_TICK_LINES = 3;

/**
 * Word-wraps a category name into lines of about `maxChars`, breaking at spaces and after "/" or "-",
 * so "UTTAR PRADESH (EAST)" becomes ["UTTAR", "PRADESH", "(EAST)"]. A single word longer than a line
 * stays whole (the axis tilts as a last resort); a name needing more lines ends with "…".
 */
export function wrapTick(name: string, maxChars: number): string | string[] {
  if (name.length <= maxChars) return name;
  const words = name.split(/(?<=[/-])|\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const joiner = line && !/[/-]$/.test(line) ? " " : "";
    if (line && (line + joiner + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line + joiner + word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > MAX_TICK_LINES) {
    const kept = lines.slice(0, MAX_TICK_LINES);
    kept[MAX_TICK_LINES - 1] = `${kept[MAX_TICK_LINES - 1]}…`;
    return kept;
  }
  return lines;
}
