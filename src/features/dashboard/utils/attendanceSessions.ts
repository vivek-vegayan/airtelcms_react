import type { AttendanceRow, AttendanceSession } from "../types/dashboard.types";

/**
 * Builds the list of today's attendance sessions from a single AttendanceRow.
 * The API currently supports only one clock-in/out pair per day, so this
 * always returns 0 or 1 entries — kept list-shaped so the timeline UI can
 * render multiple sessions without changes once the backend supports it.
 */
export function buildSessions(attendance: AttendanceRow | null | undefined): AttendanceSession[] {
  if (!attendance?.clockInTime) return [];

  return [
    {
      index: 1,
      clockInTime: attendance.clockInTime,
      clockOutTime: attendance.clockOutTime,
      durationMinutes: attendance.workedMinutes,
      isActive: attendance.status === "CLOCKED_IN",
    },
  ];
}
