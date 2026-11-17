import { useMemo, useRef } from "react";
import { Box, useTheme } from "@mui/material";
import { Bar } from "react-chartjs-2";
import type { Chart as ChartJS, ChartOptions } from "chart.js";
import { chartChrome } from "../../crqAnalytics/utils/chartPalette";
import "../../crqAnalytics/utils/chartSetup";
import { fmtN } from "../utils/p1Format";

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
        data: s.data,
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
            if (hit) series[hit.datasetIndex]?.onClick?.(hit.index);
          }
        : undefined,
      onHover: clickable
        ? (evt, _active, chart) => {
            const over = evt.native ? chart.getElementsAtEventForMode(evt.native, "nearest", { intersect: true }, true) : [];
            chart.canvas.style.cursor = over.length ? "pointer" : "default";
          }
        : undefined,
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
              const lines = (extraTip?.(i) ?? []).map(([k, v]) => `${k}: ${v}`);
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
          ticks: { color: chrome.muted, font: { size: 11 }, maxRotation: 0, autoSkip: true, autoSkipPadding: 12 },
        },
        y: {
          stacked,
          beginAtZero: true,
          grid: { color: chrome.gridline },
          border: { display: false },
          ticks: { color: chrome.muted, font: { size: 11 }, precision: 0 },
        },
      },
    }),
    [clickable, series, stacked, chrome, theme, labels, tipLabels, extraTip],
  );

  return (
    <Box sx={{ height, position: "relative" }} role="img" aria-label={ariaLabel}>
      <Bar ref={chartRef} data={data} options={options} />
    </Box>
  );
}
