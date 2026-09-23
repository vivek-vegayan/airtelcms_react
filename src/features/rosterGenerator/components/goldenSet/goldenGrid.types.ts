export interface GoldenSetEmployee {
  prefId: number;
  name: string;
  olmid: string;
  role: string;
  level: string;
  shifts: string[];
}

export type EditMode = "select" | "drag" | "week";

export interface HistoryEntry {
  grid: Record<number, string[]>;
}

export interface ShiftColor {
  background: string;
  color: string;
  border: string;
}

export interface LevelMeta {
  bg: string;
  text: string;
  solid: string;
}

export interface ShiftSummary {
  work: number;
  night: number;
  off: number;
  loadPct: number;
}

export interface GoldenGridTokens {
  isDark: boolean;
  accent: string;
  accentDim: string;
  accentBorder: string;
  success: string;
  successDim: string;
  textPrimary: string;
  textSecondary: string;
  textDim: string;
  border: string;
  surface: string;
  surface2: string;
  bg: string;
  radius: string;
  radiusL: string;
  radiusXL: string;
}

export interface GoldenGridScreenProps {
  teamId?: number | string;
  subTeamId?: number | string;
}
