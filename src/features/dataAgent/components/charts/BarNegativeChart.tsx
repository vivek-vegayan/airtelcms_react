import { useTheme } from "@mui/material";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { chartChrome } from "../../../crqAnalytics/utils/chartPalette";
import "../../../crqAnalytics/utils/chartSetup";
import { abbreviateNumber } from "../../utils/formatNumber";
import type { WidgetData } from "../../types/dataAgent.types";
import EmptyChartState from "../EmptyChartState";

export default function BarNegativeChart({ data }: { data: WidgetData }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const chrome = chartChrome(isDark);

  if (!data.rows.length) return <EmptyChartState />;

  const firstRow = data.rows[0];
  const numericCols = data.columns.filter((c) => typeof firstRow[c] === "number");
  const textCols = data.columns.filter((c) => typeof firstRow[c] === "string");
  const labelCol = textCols[0] ?? data.columns[0];
  const valueCol = numericCols[0] ?? data.columns[data.columns.length - 1];

  const labels = data.rows.map((r) => String(r[labelCol] ?? ""));
  const values = data.rows.map((r) => {
    const v = Number(r[valueCol]);
    return Number.isNaN(v) ? 0 : v;
  });

  const positive = theme.palette.success.main;
  const negative = theme.palette.error.main;

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: chrome.text,
        bodyColor: chrome.text,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const v = Number(ctx.parsed.x);
            return `${valueCol}: ${v >= 0 ? "+" : ""}${abbreviateNumber(v)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: chrome.gridline },
        ticks: { color: chrome.muted, font: { size: 10 }, callback: (v) => abbreviateNumber(Number(v)) },
      },
      y: {
        grid: { display: false },
        ticks: { color: chrome.text, font: { size: 10 } },
      },
    },
  };

  return (
    <div style={{ height: Math.max(240, labels.length * 36) }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: values.map((v) => (v >= 0 ? positive : negative)),
              borderRadius: 4,
            },
          ],
        }}
        options={options}
      />
    </div>
  );
}
