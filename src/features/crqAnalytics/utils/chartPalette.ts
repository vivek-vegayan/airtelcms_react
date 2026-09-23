// Validated categorical palette (dataviz skill's reference instance) — kept
// separate from the app's status tokens (success/warning/danger), which stay
// reserved for actual status meaning (KPI card tones, chips) and are never
// reused as chart series colors.
const CATEGORICAL_LIGHT = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#4a3aa7", // 7 violet
  "#e34948", // 8 red
] as const;

const CATEGORICAL_DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
] as const;

export function categoricalPalette(isDark: boolean): readonly string[] {
  return isDark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}

/** Stable series→slot assignment reused across every chart that plots these series, so identity never shifts. */
const SERIES_SLOT: Record<string, number> = {
  raised: 0,
  totalCount: 0,
  receivedInCcb: 0,
  movedToSe: 1,
  closed: 2,
  seToClosed: 2,
  ccb: 3,
  se: 4,
  rejected: 7,
};

export function seriesColor(seriesName: string, isDark: boolean): string {
  const palette = categoricalPalette(isDark);
  const slot = SERIES_SLOT[seriesName] ?? 0;
  return palette[slot % palette.length];
}

/** For dynamic category sets (domain names, rejection reasons) — fixed order by index, folds past 8 into "Other". */
export function categoryColor(index: number, isDark: boolean): string {
  const palette = categoricalPalette(isDark);
  return palette[index % palette.length];
}

export const MAX_CATEGORICAL_SLOTS = CATEGORICAL_LIGHT.length;

// Sequential blue ramp — for the aging-heatmap intensity grid (one hue, light→dark).
const SEQUENTIAL_BLUE = [
  "#cde2fb", // 100
  "#9ec5f4", // 200
  "#6da7ec", // 300
  "#3987e5", // 400
  "#256abf", // 500
  "#184f95", // 600
  "#0d366b", // 700
] as const;

export function sequentialBlue(intensity01: number): string {
  const clamped = Math.max(0, Math.min(1, intensity01));
  const idx = Math.round(clamped * (SEQUENTIAL_BLUE.length - 1));
  return SEQUENTIAL_BLUE[idx];
}

export interface ChartChrome {
  gridline: string;
  axis: string;
  muted: string;
  text: string;
}

const CHROME: Record<"light" | "dark", ChartChrome> = {
  light: { gridline: "#e1e0d9", axis: "#c3c2b7", muted: "#898781", text: "#0b0b0b" },
  dark: { gridline: "#2c2c2a", axis: "#383835", muted: "#898781", text: "#ffffff" },
};

export function chartChrome(isDark: boolean): ChartChrome {
  return isDark ? CHROME.dark : CHROME.light;
}
