import { useTheme } from "@mui/material";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { chartChrome, categoricalPalette } from "../../../crqAnalytics/utils/chartPalette";
import "../../../crqAnalytics/utils/chartSetup";
import { abbreviateNumber } from "../../utils/formatNumber";
import type { WidgetData } from "../../types/dataAgent.types";
import EmptyChartState from "../EmptyChartState";

function detectTimeCol(columns: string[]): string | undefined {
  return columns.find((col) => {
    const lower = col.toLowerCase();
    return (
      lower.includes("time") ||
      lower.includes("date") ||
      lower.includes("month") ||
      lower.includes("year") ||
      lower.includes("day")
    );
  });
}

interface Props {
  data: WidgetData;
  /** Renders as a filled area chart instead of a plain line — used by AreaChart. */
  area?: boolean;
}

export default function LineChart({ data, area = false }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const chrome = chartChrome(isDark);
  const palette = categoricalPalette(isDark);

  if (!data.rows.length) return <EmptyChartState />;

  const firstRow = data.rows[0];
  const numericCols = data.columns.filter((c) => typeof firstRow[c] === "number");
  const textCols = data.columns.filter((c) => typeof firstRow[c] === "string");
  const xCol = detectTimeCol(data.columns) ?? textCols[0] ?? data.columns[0];
  const labels = data.rows.map((r) => String(r[xCol] ?? ""));
  const isMultiSeries = numericCols.length >= 2;
  const seriesCols = isMultiSeries ? numericCols : [numericCols[0] ?? data.columns[data.columns.length - 1]];

  const datasets = seriesCols.map((col, i) => {
    const color = palette[i % palette.length];
    return {
      label: col,
      data: data.rows.map((r) => {
        const v = Number(r[col]);
        return Number.isNaN(v) ? 0 : v;
      }),
      borderColor: color,
      backgroundColor: area ? `${color}33` : color,
      fill: area,
      tension: 0.35,
      pointRadius: labels.length > 20 ? 0 : 3,
    };
  });

  const manyItems = labels.length > 10;

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: datasets.length > 1,
        position: "bottom",
        labels: { color: chrome.text, usePointStyle: true, boxWidth: 8, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: chrome.text,
        bodyColor: chrome.text,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${abbreviateNumber(Number(ctx.parsed.y))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: chrome.muted, font: { size: 10 }, maxRotation: manyItems ? 30 : 0, autoSkip: true },
      },
      y: {
        grid: { color: chrome.gridline },
        ticks: { color: chrome.muted, font: { size: 10 }, callback: (v) => abbreviateNumber(Number(v)) },
      },
    },
  };

  return (
    <div style={{ height: manyItems ? 300 : 260 }}>
      <Line data={{ labels, datasets }} options={options} />
    </div>
  );
}
