export type SlotVisibilityTab =
  | "capacity"
  | "activity"
  | "plans";

export type ShiftType = "A" | "B" | "G" | "LG" | "N";

export type SlotStatus =
  | "AVAILABLE"
  | "LOW"
  | "FULL"
  | "HOLIDAY"
  | "FREEZE"
  | "NOTROSTER"
  | "NOELIG"
  | "NOROSTER";

export interface ShiftDefinition {
  name: ShiftType;
  window: string;
  off: number;
}

export interface DayInfo {
  dow: string;
  day: string;
  month?: string;
  dowColor?: string;
}

export interface CapacityCell {
  big: string;
  small: string;
  bg: string;
  fg: string;
  ring: string;
  label: string;
  status: SlotStatus;
  fit: number;
  reserved: number;
  confirmed: number;
}

export interface CapacityRow {
  shift: ShiftType;
  window: string;
  cells: CapacityCell[];
}

export interface Engineer {
  name: string;
  olm: string;
  level: string;
  freeLabel: string;
  confirmedWidth: string;
  reservedWidth: string;
}

export interface SelectedSlot {
  title: string;
  work: string;
  status: string;
  bg: string;
  fg: string;
  reason?: string;
  rostered: number;
  reserved: number;
  confirmed: number;
  engineers: Engineer[];
}

export interface CapacityKpi {
  fit: number;
  reserved: number;
  confirmed: number;
  utilization: string;
}

export interface ActivityAvailabilityRow {
  date: string;
  shift: string;
  work: string;
  rostered: number;
  eligible: number;
  reserved: number;
  confirmed: number;
  fit: number;
  status: string;
  reason: string;
}

export interface PlanCell {
  value: string;
  background: string;
  foreground: string;
  title: string;
}

export interface PlanRow {
  id: number;
  type: string;
  domain: string;
  layer: string;
  impact: string;
  minutes: number;
  shifts: string;
  cells: PlanCell[];
  total: number;
  totalColor: string;
}