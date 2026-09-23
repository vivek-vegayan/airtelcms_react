import { useMemo } from "react";
import type { LeaveHistoryResponse, LeaveTabValue } from "../types/leave.types";
import { normaliseStatus } from "../utils/leave.utils";

/**
 * Client-side filter — no extra API calls needed.
 */
export const useFilteredLeaves = (
  leaves: LeaveHistoryResponse[],
  tab: LeaveTabValue
): LeaveHistoryResponse[] =>
  useMemo(
    () =>
      tab === "ALL"
        ? leaves
        : leaves.filter((l) => normaliseStatus(l.leaveStatus) === tab),
    [leaves, tab]
  );