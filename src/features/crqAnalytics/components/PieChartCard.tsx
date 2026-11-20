import { useMemo } from "react";
import { useTheme } from "@mui/material";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, type ChartOptions, type LegendItem, type Plugin } from "chart.js";
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
  /** Explicit slice colours by index (a fixed series such as CCB / SE); defaults to the categorical palette. */
  colors?: readonly string[];
  /** Called with the clicked slice's label (folded "Other" slice is not clickable). */
  onSliceClick?: (label: string) => void;
  /** Show each slice's count and share in the legend ("CCB · 42 · 63%"), so no hover is needed. */
  showValues?: boolean;
  /** When set, the total is written in the middle of the ring with this word under it ("cancelled"). */
  centerUnit?: string;
}

const fmt = (v: number) => Math.round(v).toLocaleString("en-IN");

/** Doughnut chart for a category breakdown (e.g. rejection reasons) — folds past 8 categories into "Other". */
export function PieChartCard({ slices, isLoading, isError, colors, onSliceClick, showValues = false, centerUnit }: Props) {
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
          backgroundColor: folded.map((_, i) => colors?.[i] ?? categoryColor(i, isDark)),
          borderColor: theme.palette.background.paper,
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }),
    [folded, isDark, theme, colors],
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
          labels: {
            color: chrome.text,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            font: { size: 11 },
            ...(showValues
              ? {
                  generateLabels: (chart: ChartJS<"doughnut">): LegendItem[] =>
                    ChartJS.overrides.doughnut.plugins.legend.labels.generateLabels(chart).map((item, i) => {
                      const value = folded[i]?.value ?? 0;
                      const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                      return { ...item, text: `${item.text} · ${fmt(value)} · ${pct}%` };
                    }),
                }
              : {}),
          },
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
    [chrome, theme, total, onSliceClick, folded, showValues],
  );

  // Total in the middle of the ring. react-chartjs-2 registers plugins once, when the chart is
  // created, so the chart is re-created (key) when the theme changes and the colours follow.
  const plugins = useMemo<Plugin<"doughnut">[]>(
    () =>
      centerUnit == null
        ? []
        : [
            {
              id: "centerTotal",
              afterDatasetsDraw(chart) {
                const arc = chart.getDatasetMeta(0).data[0] as unknown as { x: number; y: number } | undefined;
                if (!arc) return;
                const sum = (chart.data.datasets[0]?.data ?? []).reduce<number>((s, v) => s + (Number(v) || 0), 0);
                const family = ChartJS.defaults.font.family ?? "system-ui, sans-serif";
                const { ctx } = chart;
                ctx.save();
                ctx.textAlign = "center";
                ctx.fillStyle = chrome.text;
                ctx.font = `700 20px ${family}`;
                ctx.textBaseline = "bottom";
                ctx.fillText(fmt(sum), arc.x, arc.y + 4);
                ctx.fillStyle = chrome.muted;
                ctx.font = `500 11px ${family}`;
                ctx.textBaseline = "top";
                ctx.fillText(centerUnit, arc.x, arc.y + 6);
                ctx.restore();
              },
            },
          ],
    [centerUnit, chrome.text, chrome.muted],
  );

  if (isError) return <EmptyOrErrorState kind="error" />;
  if (!isLoading && folded.length === 0) return <EmptyOrErrorState kind="empty" />;

  return <Doughnut key={theme.palette.mode} data={data} options={options} plugins={plugins} />;
}
