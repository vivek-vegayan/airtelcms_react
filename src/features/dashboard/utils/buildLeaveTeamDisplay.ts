import { format, parseISO } from "date-fns";
import { getInitials } from "../../userManagement/utils/userHelpers";
import type { EmployeeOnLeaveRow, LeaveTeamMember, ToneKey } from "../types/dashboard.types";

const AVATAR_TONES: readonly ToneKey[] = ["accent", "success", "info", "warning", "danger"];

function toneForLeaveType(leaveType: string): ToneKey {
  const t = leaveType.toLowerCase();
  if (t.includes("sick")) return "danger";
  if (t.includes("casual")) return "accent";
  if (t.includes("annual") || t.includes("earned")) return "success";
  return "info";
}

/** Maps /dashboard/employeesonleave rows into the OnLeaveTodayCard display shape. */
export function buildLeaveTeamDisplay(rows: readonly EmployeeOnLeaveRow[]): LeaveTeamMember[] {
  return rows.map((row) => ({
    name: row.employeeName,
    role: row.subDomainName ?? row.olmid,
    type: row.leaveType,
    tone: toneForLeaveType(row.leaveType),
    avatarTone: AVATAR_TONES[row.userId % AVATAR_TONES.length],
    initials: getInitials(row.employeeName),
    returnDate: format(parseISO(row.leaveEndDate), "MMM d"),
  }));
}
