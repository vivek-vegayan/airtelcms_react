export type ShiftCode = "A" | "B" | "G" | "LG" | "N" | "H" | "WO" | "OFF";

export interface FutureWeekRow {
  // Lower-case "w" — FutureWeekRowDto's W7D1..W7D7 fields serialize under
  // Jackson's mangled property names (w7D1..w7D7): a single leading capital
  // followed by a digit gets lower-cased on the way out. Verified against
  // the live /rostergenration/futureweek response.
  w7D1: string;
  w7D2: string;
  w7D3: string;
  w7D4: string;
  w7D5: string;
  w7D6: string;
  w7D7: string;
  employeeName: string;
  futureId: number;
  isoWeek: number;
  isoYear: number;
  jobLevel: string;
  olmid: string;
  roleCode: string;
  userId: number;
}

export interface FutureWeekApiResponse {
  success: boolean;
  totalEmployees: number;
  isoYear: number;
  isoWeek: number;
  data: FutureWeekRow[];
}

export interface FutureWeekQueryParams {
  subDomainId: number;
  pageNumber?: number;
  pageSize?: number;
}

// ─── Normalised internal types ────────────────────────────────────────────────

export interface NormalisedEmployee {
  rowKey: number;
  employeeName: string;
  olmid: string;
  jobLevel: string;
  roleCode: string;
  userId: number;
  futureId: number;
  shifts: ShiftCode[];
}

// ─── Column metadata ──────────────────────────────────────────────────────────

export interface DayColumn {
  dayIndex: number;
  shortLabel: string;
  longLabel: string;
  isWeekend: boolean;
  isWeekendStart: boolean;
}