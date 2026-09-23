import { useMemo } from "react";
import { useTheme } from "@mui/material";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { chartChrome, categoricalPalette } from "../../../crqAnalytics/utils/chartPalette";
import "../../../crqAnalytics/utils/chartSetup";
import { pickLabelCol, pickValueCol } from "../../utils/pickChartColumns";
import { abbreviateNumber } from "../../utils/formatNumber";
import type { WidgetData } from "../../types/dataAgent.types";
import EmptyChartState from "../EmptyChartState";

interface Props {
  data: WidgetData;
}

export default function BarChart({ data }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const chrome = chartChrome(isDark);
  const palette = categoricalPalette(isDark);

  const firstRow = data.rows[0] ?? {};
  const textCols = data.columns.filter((c) => typeof firstRow[c] === "string");
  const numericCols = data.columns.filter((c) => typeof firstRow[c] === "number");
  const isMultiSeries = numericCols.length > 1 && textCols.length === 1;

  const chartData = useMemo(() => {
    if (isMultiSeries) {
      const xCol = textCols[0];
      return {
        labels: data.rows.map((r) => String(r[xCol])),
        datasets: numericCols.map((col, i) => ({
          label: col,
          data: data.rows.map((r) => Number(r[col])),
          backgroundColor: palette[i % palette.length],
          borderRadius: 4,
          maxBarThickness: 32,
        })),
      };
    }
    const labelCol = pickLabelCol(data.columns, data.question ?? "");
    const valueCol = pickValueCol(data.columns, data.rows);
    return {
      labels: data.rows.map((r) => String(r[labelCol])),
      datasets: [
        {
          label: valueCol,
          data: data.rows.map((r) => Number(r[valueCol])),
          backgroundColor: palette[0],
          borderRadius: 4,
          maxBarThickness: 40,
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isMultiSeries, palette]);

  const manyItems = chartData.labels.length > 8;

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartData.datasets.length > 1,
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
          ticks: { color: chrome.muted, font: { size: 10 }, maxRotation: manyItems ? 40 : 0, autoSkip: true },
        },
        y: {
          beginAtZero: true,
          grid: { color: chrome.gridline },
          ticks: { color: chrome.muted, font: { size: 10 }, callback: (v) => abbreviateNumber(Number(v)) },
        },
      },
    }),
    [chrome, theme, chartData.datasets.length, manyItems],
  );

  if (!data.rows.length) return <EmptyChartState />;

  return (
    <div style={{ height: manyItems ? 300 : 260 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
