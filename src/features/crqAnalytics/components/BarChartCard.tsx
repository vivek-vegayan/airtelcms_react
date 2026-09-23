import { useMemo } from "react";
import { useTheme } from "@mui/material";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { chartChrome } from "../utils/chartPalette";
import { EmptyOrErrorState } from "./EmptyOrErrorState";
import "../utils/chartSetup";

export interface BarSeries {
  label: string;
  data: number[];
  color: string;
}

interface Props {
  labels: string[];
  series: BarSeries[];
  horizontal?: boolean;
  /** Stack all series into a single bar per category (e.g. CCB + SE) instead of grouping them side by side. */
  stacked?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  /** Called with the clicked bar's category label (e.g. a domain/stage name). */
  onBarClick?: (label: string) => void;
}

export function BarChartCard({ labels, series, horizontal = false, stacked = false, isLoading, isError, onBarClick }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const chrome = chartChrome(isDark);

  const data = useMemo(
    () => ({
      labels,
      datasets: series.map((s, i) => ({
        label: s.label,
        data: s.data,
        backgroundColor: s.color,
        // When stacked, only the top-most segment gets rounded corners.
        borderRadius: !stacked || i === series.length - 1 ? 4 : 0,
        borderSkipped: "bottom" as const,
        maxBarThickness: 24,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      })),
    }),
    [labels, series, stacked],
  );

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      indexAxis: horizontal ? "y" : "x",
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      onClick: onBarClick
        ? (_evt, elements) => {
            const idx = elements[0]?.index;
            if (idx != null) onBarClick(labels[idx]);
          }
        : undefined,
      onHover: onBarClick
        ? (evt, elements) => {
            (evt.native?.target as HTMLElement | undefined)?.style?.setProperty(
              "cursor",
              elements.length ? "pointer" : "default",
            );
          }
        : undefined,
      plugins: {
        legend: {
          display: series.length > 1,
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
        x: {
          stacked,
          grid: { display: horizontal, color: chrome.gridline },
          ticks: { color: chrome.muted, font: { size: 11 } },
        },
        y: {
          stacked,
          beginAtZero: true,
          grid: { display: !horizontal, color: chrome.gridline },
          ticks: { color: chrome.muted, font: { size: 11 }, precision: 0 },
        },
      },
    }),
    [horizontal, stacked, series.length, chrome, theme, onBarClick, labels],
  );

  if (isError) return <EmptyOrErrorState kind="error" />;
  if (!isLoading && labels.length === 0) return <EmptyOrErrorState kind="empty" />;

  return <Bar data={data} options={options} />;
}
