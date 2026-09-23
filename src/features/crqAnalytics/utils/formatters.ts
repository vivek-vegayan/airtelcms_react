export const formatPct = (v: number | null | undefined): string =>
  v == null ? "—" : `${v.toFixed(1)}%`;

export const formatTrend = (v: number | null | undefined): { text: string; tone: "success" | "danger" } | null => {
  if (v == null || Number.isNaN(v)) return null;
  const tone = v >= 0 ? "success" : "danger";
  const sign = v >= 0 ? "+" : "";
  return { text: `${sign}${v.toFixed(1)}%`, tone };
};

export const formatHrs = (v: number | null | undefined): string => (v == null ? "—" : `${v.toFixed(1)}h`);
