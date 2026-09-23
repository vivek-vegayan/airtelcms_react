import { useRef, useState, useEffect } from "react";
import { Box, useTheme } from "@mui/material";
import { Pie } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { chartChrome, categoricalPalette } from "../../../crqAnalytics/utils/chartPalette";
import "../../../crqAnalytics/utils/chartSetup";
import { pickLabelCol, pickValueCol } from "../../utils/pickChartColumns";
import type { WidgetData } from "../../types/dataAgent.types";
import EmptyChartState from "../EmptyChartState";

export default function PieChart({ data }: { data: WidgetData }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const chrome = chartChrome(isDark);
  const palette = categoricalPalette(isDark);
  const containerRef = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setNarrow(entry.contentRect.width < 340);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!data.rows.length) return <EmptyChartState />;

  const labelCol = pickLabelCol(data.columns, data.question ?? "");
  const valueCol = pickValueCol(data.columns, data.rows);
  const labels = data.rows.map((r) => String(r[labelCol]));
  const values = data.rows.map((r) => Number(r[valueCol]));
  const total = values.reduce((a, b) => a + b, 0);

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: narrow || labels.length > 6 ? "bottom" : "right",
        labels: { color: chrome.text, usePointStyle: true, boxWidth: 8, font: { size: 10 } },
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
            const value = Number(ctx.parsed);
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
            return `${ctx.label}: ${value.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <Box ref={containerRef} sx={{ height: 260 }}>
      <Pie
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: labels.map((_, i) => palette[i % palette.length]),
              borderColor: theme.palette.background.paper,
              borderWidth: 2,
            },
          ],
        }}
        options={options}
      />
    </Box>
  );
}
