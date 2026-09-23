import type { ReactNode } from "react";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import BrushIcon from "@mui/icons-material/Brush";
import CalendarViewWeekIcon from "@mui/icons-material/CalendarViewWeek";
import type { EditMode, LevelMeta, ShiftColor } from "./goldenGrid.types";

export const TOTAL_COLS = 42;
export const CELL_W = 42;
export const CELL_H = 28;

// Sticky name column — only this column shrinks on narrow viewports; the 42
// day-columns keep horizontal-scrolling since they can't meaningfully reflow.
export const EMP_COL_W = { xs: 170, sm: 200, md: 240 };

export const AVATAR = 28;
export const MONO = "'Roboto Mono', 'Fira Mono', monospace";

// Fallback offset for the day-header sticky row, used only until
// GoldenGridTable measures the week-header row's real rendered height.
export const WEEK_ROW_H = 38;

export const DOW_SHORT: string[] = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
export const DOW_LONG: string[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const SHIFT_CODES: string[] = [
  "G",
  "N",
  "A",
  "B",
  "L",
  "W",
  "H",
  "C",
  "Leave",
];

export const SHIFT_META: Record<string, { label: string }> = {
  G: { label: "General" },
  N: { label: "Night" },
  A: { label: "Afternoon" },
  B: { label: "Early" },
  L: { label: "Late" },
  W: { label: "Week Off" },
  H: { label: "Holiday" },
  C: { label: "Comp Off" },
  Leave: { label: "Leave" },
};

export const LEVEL_META: Record<string, LevelMeta> = {
  L1: { bg: "#EFF6FF", text: "#1D4ED8", solid: "#3B82F6" },
  L2: { bg: "#F0FDF4", text: "#15803D", solid: "#22C55E" },
  L3: { bg: "#FFF7ED", text: "#C2410C", solid: "#F97316" },
  L4: { bg: "#FDF4FF", text: "#7E22CE", solid: "#A855F7" },
};

export const shiftColorMap = new Map<string, ShiftColor>([
  ["Leave", { background: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" }],
  [
    "New Joinee",
    { background: "#FFFBEB", color: "#92400E", border: "#FCD34D" },
  ],
  ["N", { background: "#EEF2FF", color: "#3730A3", border: "#818CF8" }],
  ["A", { background: "#F5F3FF", color: "#6B21A8", border: "#C4B5FD" }],
  ["B", { background: "#ECFEFF", color: "#155E75", border: "#67E8F9" }],
  ["G", { background: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD" }],
  ["L", { background: "#ECFDF5", color: "#065F46", border: "#6EE7B7" }],
  ["W", { background: "#F8FAFC", color: "#475569", border: "#CBD5E1" }],
  ["H", { background: "#FFF7ED", color: "#C2410C", border: "#FDBA74" }],
  ["C", { background: "#F1F5F9", color: "#475569", border: "#CBD5E1" }],
]);

export const DEFAULT_SHIFT_COLOR: ShiftColor = {
  background: "#EFF6FF",
  color: "#1D4ED8",
  border: "#93C5FD",
};

export const EDIT_MODES: {
  id: EditMode;
  label: string;
  icon: ReactNode;
  tooltip: string;
}[] = [
  {
    id: "select",
    label: "Row select",
    icon: <CheckBoxOutlineBlankIcon sx={{ fontSize: 13 }} />,
    tooltip: "Select rows and apply shifts in bulk",
  },
  {
    id: "drag",
    label: "Free paint",
    icon: <BrushIcon sx={{ fontSize: 13 }} />,
    tooltip: "Click or drag cells to paint shifts",
  },
  {
    id: "week",
    label: "Week override",
    icon: <CalendarViewWeekIcon sx={{ fontSize: 13 }} />,
    tooltip: "Right-click a week header to override all 7 days",
  },
];

// Sticky z-index hierarchy for GoldenGridTable. Footer must outrank
// STICKY_COLUMN so the body's sticky name column doesn't render over the
// bottom-pinned footer as rows scroll past it.
export const Z_INDEX = {
  HEADER_CORNER: 150, // corner cells that span both header rows
  WEEK_HEADER: 110, // "Week N" row
  DAY_HEADER: 100, // "Mo Tu We …" row
  STICKY_COLUMN: 90, // employee name column in body rows
  FOOTER_CORNER: 96, // "Staffed / Day" label cell (bottom + left sticky)
  FOOTER: 92, // remaining footer cells (bottom sticky only)
};
