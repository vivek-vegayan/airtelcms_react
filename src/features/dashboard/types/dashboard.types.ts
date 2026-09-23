import type { ShiftColorTriple } from "../../userMe/userRoster/constants/shiftColors";

/** Semantic colour tone — resolved against theme tokens at render time. */
export type ToneKey = "accent" | "success" | "warning" | "danger" | "info";

export interface Holiday {
  month: string;
  day: string;
  name: string;
  type: string;
  countdown: string;
  tone: ToneKey;
}

export interface LeaveTeamMember {
  name: string;
  role: string;
  type: string;
  tone: ToneKey;
  avatarTone: ToneKey;
  initials: string;
  returnDate: string;
}

export interface ShiftInfo {
  name: string;
  start: string;
  end: string;
  dur: string;
  code?: string;
  colors?: ShiftColorTriple;
  workMode?: WorkMode | null;
}

export interface WeekDay {
  day: string;
  date: number;
  shift: ShiftInfo | null;
  isOff?: boolean;
  isToday?: boolean;
  /** Label shown on off tiles, e.g. "Week off" / "Holiday" / "On leave". */
  offLabel?: string;
}

export type StatIconKey = "trending" | "clock" | "calendar" | "event";

export interface StatCardConfig {
  key: string;
  label: string;
  display: number | string;
  sub: string;
  tone: ToneKey;
  icon: StatIconKey;
  /** Small badge next to the label, e.g. "▲ 8%" — tone drives its colour. */
  delta?: { text: string; tone: ToneKey };
  /** Last few data points rendered as a mini sparkline at the card foot. */
  trend?: readonly number[];
}

/** Raw row shapes returned by /dashboard/* endpoints (see EmployeeDashboardController). */
export interface UpcomingHolidayRow {
  holidayDate: string;
  holidayDay: string;
  holidayOccasion: string;
}

export interface EmployeeOnLeaveRow {
  userId: number;
  olmid: string;
  employeeName: string;
  subDomainName: string | null;
  leaveType: string;
  leaveDuration: string;
  leaveStartDate: string;
  leaveEndDate: string;
  leaveDate: string;
}

export interface EngineerDailyAssignmentRow {
  planNo: string;
  crqNo: string | null;
  startTime: string | null;
  endTime: string | null;
  stage: string;
  durationMins: number | null;
  remark: string;
}

export interface EmpWorkLocationRow {
  workDate: string;
  shiftName: string;
  workfromLocation: string;
}

export type WorkMode = "WFH" | "WFO";

export type AttendanceStatus = "NOT_STARTED" | "CLOCKED_IN" | "CLOCKED_OUT";

export interface AttendanceRow {
  userId: number;
  workDate: string;
  workfromLocation: WorkMode | null;
  shiftId: number | null;
  shiftName: string | null;
  shiftRange: string | null;
  clockInTime: string | null;
  clockOutTime: string | null;
  status: AttendanceStatus;
  workedMinutes: number | null;
}

/**
 * A single clock-in/out pair, list-shaped so the UI can render multiple
 * sessions per day once the backend supports it. Today's API only ever
 * yields at most one session — see buildSessions() in utils/attendanceSessions.ts.
 */
export interface AttendanceSession {
  index: number;
  clockInTime: string;
  clockOutTime: string | null;
  durationMinutes: number | null;
  isActive: boolean;
}
