export interface RosterDay {
  assignActCount: number;
  availableMins: number;
  shiftDisplay: string;
  workMode: string | null;
}

export interface UserRoster {
  userId: number;
  olmid: string;
  /** Sent by UserRosterDto; optional here because older cached payloads omit it. */
  employeeName?: string;
  jobLevel?: string;
  roster: Record<string, RosterDay>;
}

export interface MonthlyRosterResponse {
  data: UserRoster[];
  startDate: string;
  endDate: string;
  success: boolean;
  totalUsers: number;
  // Present instead of the success fields when the backend returns an error payload.
  status?: "Error";
  message?: string;
}

/** Shift details carried alongside the event so the UI never re-parses the title. */
export interface ShiftResource {
  /** Canonical shift code, e.g. "N", "LG", "W". */
  code: string;
  /** Human-readable name for the code, e.g. "Night". */
  label: string;
  workMode: string | null;
  /** Raw `shiftDisplay` from the API, e.g. "N (10 PM - 7 AM)" — shown verbatim in details. */
  shiftDisplay: string;
  /** Activities already booked on the day — drives the "busy" indicator. */
  assignActCount: number;
  /** Minutes still bookable on the day — drives the availability indicator. */
  availableMins: number;
  /** `YYYY-MM-DD` key of the roster entry this event was built from. */
  dateKey: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource?: ShiftResource;
}

export type ToastSeverity = "success" | "info" | "warning" | "error";

export interface ToastState {
  message: string;
  severity: ToastSeverity;
}

/**
 * Per-day facts the calendar chrome reads (cell background, date-header
 * badges, tooltips). Keyed by the API's own `YYYY-MM-DD` string so nothing
 * downstream has to re-derive a date key — and so a timezone offset can
 * never shift a day the way `new Date("YYYY-MM-DD")` can.
 */
export interface RosterDayMeta {
  dateKey: string;
  code: string;
  label: string;
  shiftDisplay: string;
  workMode: string | null;
  assignActCount: number;
  availableMins: number;
  isHoliday: boolean;
  isLeave: boolean;
  isWeekOff: boolean;
  isWorking: boolean;
  /** At least one activity assigned — the day is spoken for. */
  isBusy: boolean;
}

/** Month-level roll-up shown in the summary strip. All derived client-side. */
export interface RosterMonthStats {
  working: number;
  weekOff: number;
  leave: number;
  holiday: number;
  compOff: number;
  activities: number;
  availableHours: number;
}

/**
 * Four mutually exclusive render states. Mirrors the dashboard's
 * `DashboardRosterStatus` so both surfaces reason about the same endpoint
 * identically — importantly, "the request failed" and "the request
 * succeeded with nothing in it" are never conflated.
 */
export type RosterStatus = "loading" | "error" | "empty" | "ready";
