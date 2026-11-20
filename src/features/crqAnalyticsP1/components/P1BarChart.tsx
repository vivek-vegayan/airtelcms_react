import { useMemo, useRef } from "react";
import { Box, useTheme } from "@mui/material";
import { Bar } from "react-chartjs-2";
import type { Chart as ChartJS, ChartOptions } from "chart.js";
import { chartChrome } from "../../crqAnalytics/utils/chartPalette";
import "../../crqAnalytics/utils/chartSetup";
import { fmtN } from "../utils/p1Format";
import { barValueLabels, labelAt, wrapTick } from "../utils/p1ChartLabels";

/** Smallest height (px) of a bar with a value, so a small count next to a large one stays visible and clickable. */
const MIN_BAR_PX = 6;

/** Rough width of one axis character at 11px, used to work out how many fit under a bar group. */
const TICK_CHAR_PX = 6.5;

export interface P1BarSeries {
  label: string;
  color: string;
  data: number[];
  /** Called with the category index of the clicked bar of this series. */
  onClick?: (index: number) => void;
}

interface Props {
  labels: string[];
  /** Longer category names for the tooltip title (defaults to `labels`). */
  tipLabels?: string[];
  series: P1BarSeries[];
  stacked?: boolean;
  height?: number;
  /** Extra tooltip lines for a category, e.g. [["Moves", "12"]]. */
  extraTip?: (index: number) => [string, string][];
  ariaLabel: string;
}

/**
 * Vertical bar chart on the analytics chart.js setup and chrome. Unlike BarChartCard it reports
 * which series was clicked, because every bar here opens its own CRQ list.
 */
export function P1BarChart({ labels, tipLabels, series, stacked = false, height = 230, extraTip, ariaLabel }: Props) {
  const theme = useTheme();
  const chrome = chartChrome(theme.palette.mode === "dark");
  const chartRef = useRef<ChartJS<"bar"> | null>(null);
  const clickable = series.some((s) => s.onClick);

  const data = useMemo(
    () => ({
      labels,
      datasets: series.map((s, i) => ({
        label: s.label,
        // 0 is sent as "no bar" (null): with a minimum bar height a 0 would otherwise get a stub.
        data: s.data.map((v) => (v ? v : null)),
        minBarLength: MIN_BAR_PX,
        backgroundColor: s.color,
        borderRadius: !stacked || i === series.length - 1 ? 4 : 0,
        borderSkipped: "bottom" as const,
        // 2px gap between stacked segments so neighbours stay distinct.
        borderColor: theme.palette.background.paper,
        borderWidth: stacked ? { top: 2, right: 0, bottom: 0, left: 0 } : 0,
        maxBarThickness: stacked ? 34 : 22,
        barPercentage: 0.8,
        categoryPercentage: 0.72,
      })),
    }),
    [labels, series, stacked, theme],
  );

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      onClick: clickable
        ? (evt) => {
            const chart = chartRef.current;
            if (!chart || !evt.native) return;
            const hit = chart.getElementsAtEventForMode(evt.native, "nearest", { intersect: true }, true)[0];
            // a click on a bar, or on the count written above / inside it
            const target = hit ?? (evt.x != null && evt.y != null ? labelAt(chart, evt.x, evt.y) : undefined);
            if (target) series[target.datasetIndex]?.onClick?.(target.index);
          }
        : undefined,
      onHover: clickable
        ? (evt, _active, chart) => {
            const over = evt.native ? chart.getElementsAtEventForMode(evt.native, "nearest", { intersect: true }, true) : [];
            const onLabel = evt.x != null && evt.y != null && labelAt(chart, evt.x, evt.y) != null;
            chart.canvas.style.cursor = over.length || onLabel ? "pointer" : "default";
          }
        : undefined,
      // Room above the tallest bar for its count label.
      layout: { padding: { top: 18 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.palette.background.paper,
          titleColor: chrome.text,
          bodyColor: chrome.text,
          footerColor: chrome.muted,
          footerFont: { weight: "normal" },
          borderColor: theme.palette.divider,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            title: (items) => (items[0] ? (tipLabels ?? labels)[items[0].dataIndex] : ""),
            label: (ctx) => `${ctx.dataset.label}: ${fmtN(Number(ctx.raw ?? 0))}`,
            afterBody: (items) => {
              const i = items[0]?.dataIndex;
              if (i == null) return [];
              // series with 0 have no bar, so the tooltip lists them here
              const zeros = series.filter((x) => !x.data[i]).map((x) => `${x.label}: 0`);
              const lines = [...zeros, ...(extraTip?.(i) ?? []).map(([k, v]) => `${k}: ${v}`)];
              if (stacked) lines.unshift(`Total: ${fmtN(series.reduce((s, x) => s + (x.data[i] ?? 0), 0))}`);
              return lines;
            },
            footer: () => (clickable ? "Click a bar for the CRQs" : ""),
          },
        },
      },
      scales: {
        x: {
          stacked,
          grid: { display: false },
          // Every category name is shown, word-wrapped to the width of its bar group; the axis only
          // tilts (up to 45°) when a single word is still wider than its column.
          ticks: {
            color: chrome.muted,
            font: { size: 11 },
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            callback(_value, index) {
              const perCategory = (this.width || this.chart.width) / Math.max(labels.length, 1);
              return wrapTick(labels[index] ?? "", Math.max(6, Math.floor((perCategory - 6) / TICK_CHAR_PX)));
            },
          },
        },
        y: {
          stacked,
          beginAtZero: true,
          // headroom above the tallest bar, enough for a vertical count label
          grace: "15%",
          grid: { color: chrome.gridline },
          border: { display: false },
          ticks: { color: chrome.muted, font: { size: 11 }, precision: 0 },
        },
      },
    }),
    [clickable, series, stacked, chrome, theme, labels, tipLabels, extraTip],
  );

  // Counts on the bars. react-chartjs-2 registers plugins once, when the chart is created, so the
  // chart is re-created (key) when the theme or the stacked mode changes and the labels follow.
  const valueLabels = useMemo(() => [barValueLabels({ stacked, textColor: chrome.text })], [stacked, chrome.text]);

  return (
    <Box sx={{ height, position: "relative" }} role="img" aria-label={ariaLabel}>
      <Bar key={`${theme.palette.mode}-${stacked}`} ref={chartRef} data={data} options={options} plugins={valueLabels} />
    </Box>
  );
}
