import { useTheme } from "@mui/material";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { chartChrome, categoricalPalette } from "../../../crqAnalytics/utils/chartPalette";
import "../../../crqAnalytics/utils/chartSetup";
import { abbreviateNumber } from "../../utils/formatNumber";
import type { WidgetData } from "../../types/dataAgent.types";
import EmptyChartState from "../EmptyChartState";

export default function MultiBarChart({ data }: { data: WidgetData }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const chrome = chartChrome(isDark);
  const palette = categoricalPalette(isDark);

  if (!data.rows.length) return <EmptyChartState />;

  const firstRow = data.rows[0];
  const textCols = data.columns.filter((c) => typeof firstRow[c] === "string");
  const numericCols = data.columns.filter((c) => typeof firstRow[c] === "number");
  // 2+ text cols + 1 numeric col → group by the first text col, x-axis = second.
  const isGrouped = textCols.length >= 2 && numericCols.length === 1;

  let labels: string[];
  let datasets: { label: string; data: number[]; backgroundColor: string }[];

  if (isGrouped) {
    const groupCol = textCols[0];
    const xCol = textCols[1];
    const valueCol = numericCols[0];
    const groups = [...new Set(data.rows.map((r) => String(r[groupCol])))];
    labels = [...new Set(data.rows.map((r) => String(r[xCol])))];
    datasets = groups.map((group, i) => ({
      label: group,
      backgroundColor: palette[i % palette.length],
      data: labels.map((x) => {
        const row = data.rows.find((r) => String(r[groupCol]) === group && String(r[xCol]) === x);
        return row ? Number(row[valueCol]) : 0;
      }),
    }));
  } else {
    // 1 text col + 2+ numeric cols → x-axis = text col, one series per numeric col.
    const xCol = textCols[0] ?? data.columns[0];
    labels = data.rows.map((r) => String(r[xCol]));
    datasets = numericCols.map((col, i) => ({
      label: col,
      backgroundColor: palette[i % palette.length],
      data: data.rows.map((r) => Number(r[col])),
    }));
  }

  const manyItems = labels.length > 6;

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
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
        ticks: { color: chrome.muted, font: { size: 10 }, maxRotation: manyItems ? 30 : 0 },
      },
      y: {
        beginAtZero: true,
        grid: { color: chrome.gridline },
        ticks: { color: chrome.muted, font: { size: 10 }, callback: (v) => abbreviateNumber(Number(v)) },
      },
    },
  };

  return (
    <div style={{ height: manyItems ? 320 : 260 }}>
      <Bar data={{ labels, datasets }} options={options} />
    </div>
  );
}
