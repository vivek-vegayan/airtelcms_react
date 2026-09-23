import { useMemo } from "react";
import type { LeaveHistoryResponse, LeaveStats } from "../types/leave.types";
import { normaliseStatus } from "../utils/leave.utils";

/**
 * Derives leave counts from the leave list without extra API calls.
 */
export const useLeaveStats = (leaves: LeaveHistoryResponse[]): LeaveStats =>
  useMemo(
    () => ({
      pendingCount: leaves.filter(
        (l) => normaliseStatus(l.leaveStatus) === "PENDING"
      ).length,
      approvedCount: leaves.filter(
        (l) => normaliseStatus(l.leaveStatus) === "APPROVED"
      ).length,
      rejectedCount: leaves.filter(
        (l) => normaliseStatus(l.leaveStatus) === "REJECTED"
      ).length,
    }),
    [leaves]
  );