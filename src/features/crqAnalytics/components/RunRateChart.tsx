import { useMemo } from "react";
import { useTheme } from "@mui/material";
import { Chart } from "react-chartjs-2";
import type { ChartOptions, ChartData, ChartDataset } from "chart.js";
import { chartChrome, seriesColor } from "../utils/chartPalette";
import { EmptyOrErrorState } from "./EmptyOrErrorState";
import type { CRQRunRateDto } from "../types/crqAnalytics.types";
import "../utils/chartSetup";

interface Props {
  rows: CRQRunRateDto[];
  isLoading?: boolean;
  isError?: boolean;
}

/** Received in CCB (bar) vs Moved-to-SE / SE-to-Closed (lines) — all one count-scale axis, never dual-axis. */
export function RunRateChart({ rows, isLoading, isError }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const chrome = chartChrome(isDark);

  const data = useMemo<ChartData<"bar" | "line">>(() => {
    const datasets: ChartDataset<"bar" | "line">[] = [
      {
        type: "bar" as const,
        label: "Received in CCB",
        data: rows.map((r) => r.receivedInCcb),
        backgroundColor: seriesColor("receivedInCcb", isDark),
        borderRadius: 4,
        borderSkipped: "bottom",
        maxBarThickness: 20,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
        order: 2,
      },
      {
        type: "line" as const,
        label: "Moved to SE",
        data: rows.map((r) => r.movedToSe),
        borderColor: seriesColor("movedToSe", isDark),
        backgroundColor: seriesColor("movedToSe", isDark),
        borderWidth: 2,
        pointRadius: 4,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        tension: 0.25,
        order: 1,
      },
      {
        type: "line" as const,
        label: "SE to Closed",
        data: rows.map((r) => r.seToClosed),
        borderColor: seriesColor("seToClosed", isDark),
        backgroundColor: seriesColor("seToClosed", isDark),
        borderWidth: 2,
        pointRadius: 4,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        tension: 0.25,
        order: 0,
      },
    ];
    return { labels: rows.map((r) => r.date), datasets };
  }, [rows, isDark, theme]);

  const options = useMemo<ChartOptions<"bar" | "line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: chrome.text, usePointStyle: true, boxWidth: 8, boxHeight: 8, font: { size: 11 } },
        },
        tooltip: {
          backgroundColor: theme.palette.background.paper,
          titleColor: chrome.text,
          bodyColor: chrome.text,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: chrome.muted, font: { size: 11 } } },
        y: {
          beginAtZero: true,
          grid: { color: chrome.gridline },
          ticks: { color: chrome.muted, font: { size: 11 }, precision: 0 },
        },
      },
    }),
    [chrome, theme],
  );

  if (isError) return <EmptyOrErrorState kind="error" />;
  if (!isLoading && rows.length === 0) return <EmptyOrErrorState kind="empty" />;

  return <Chart type="bar" data={data} options={options} />;
}
