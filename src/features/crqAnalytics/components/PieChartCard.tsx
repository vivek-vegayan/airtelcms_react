import { useMemo } from "react";
import { useTheme } from "@mui/material";
import { Doughnut } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { categoryColor, chartChrome, MAX_CATEGORICAL_SLOTS } from "../utils/chartPalette";
import { EmptyOrErrorState } from "./EmptyOrErrorState";
import "../utils/chartSetup";

interface Slice {
  label: string;
  value: number;
}

interface Props {
  slices: Slice[];
  isLoading?: boolean;
  isError?: boolean;
  /** Called with the clicked slice's label (folded "Other" slice is not clickable). */
  onSliceClick?: (label: string) => void;
}

/** Doughnut chart for a category breakdown (e.g. rejection reasons) — folds past 8 categories into "Other". */
export function PieChartCard({ slices, isLoading, isError, onSliceClick }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const chrome = chartChrome(isDark);

  const folded = useMemo(() => {
    if (slices.length <= MAX_CATEGORICAL_SLOTS) return slices;
    const sorted = [...slices].sort((a, b) => b.value - a.value);
    const head = sorted.slice(0, MAX_CATEGORICAL_SLOTS - 1);
    const otherTotal = sorted.slice(MAX_CATEGORICAL_SLOTS - 1).reduce((sum, s) => sum + s.value, 0);
    return [...head, { label: "Other", value: otherTotal }];
  }, [slices]);

  const total = folded.reduce((sum, s) => sum + s.value, 0);

  const data = useMemo(
    () => ({
      labels: folded.map((s) => s.label),
      datasets: [
        {
          data: folded.map((s) => s.value),
          backgroundColor: folded.map((_, i) => categoryColor(i, isDark)),
          borderColor: theme.palette.background.paper,
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }),
    [folded, isDark, theme],
  );

  const options = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      onClick: onSliceClick
        ? (_evt, elements) => {
            const idx = elements[0]?.index;
            const label = idx != null ? folded[idx]?.label : undefined;
            if (label && label !== "Other") onSliceClick(label);
          }
        : undefined,
      plugins: {
        legend: {
          position: "right",
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
          callbacks: {
            label: (ctx) => {
              const value = Number(ctx.raw ?? 0);
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return `${ctx.label}: ${value} (${pct}%)`;
            },
          },
        },
      },
      cutout: "62%",
    }),
    [chrome, theme, total, onSliceClick, folded],
  );

  if (isError) return <EmptyOrErrorState kind="error" />;
  if (!isLoading && folded.length === 0) return <EmptyOrErrorState kind="empty" />;

  return <Doughnut data={data} options={options} />;
}
