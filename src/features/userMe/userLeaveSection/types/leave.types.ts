// ─── Enums ────────────────────────────────────────────────────────────────────

export type LeaveStatus = "Pending" | "Approved" | "Rejected";
export type LeaveDuration = "Full Day" | "Half Day";
export type LeaveSession = "FirstHalf" | "SecondHalf";

// ─── API Response ─────────────────────────────────────────────────────────────

export interface LeaveHistoryResponse {
  leaveId: number;
  userId: number;
  leaveType: string;
  leaveStartDate: string;
  leaveEndDate: string;
  leaveStatus: LeaveStatus;
  leaveDuration: LeaveDuration;
  leaveReason: string;
  ageDays: number;
  approvedBy: string | null;
  rejectionReason: string | null;
  statusChangeAt: string | null;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateLeavePayload {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveDuration: LeaveDuration;
  session?: LeaveSession;
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type LeaveTabValue = "ALL" | Uppercase<LeaveStatus>;

export interface LeaveStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}