import { useMemo } from "react";
import { format } from "date-fns";
import { useGetDailyAssignmentsQuery } from "../api/dashboardApi";
import type { EngineerDailyAssignmentRow } from "../types/dashboard.types";

export type DashboardAssignmentsStatus = "loading" | "error" | "empty" | "ready";

export interface DashboardAssignmentsState {
  assignments: EngineerDailyAssignmentRow[];
  doneCount: number;
  totalCount: number;
  status: DashboardAssignmentsStatus;
  errorMessage?: string;
}

/** Owns the dashboard's live "Today's assignments" data, backed by /dashboard/dailyassignments. */
export function useDashboardAssignments(): DashboardAssignmentsState {
  const date = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const { data, isLoading, isError } = useGetDailyAssignmentsQuery({ date });

  // isLoading (no cached data yet) drives the skeleton; background isFetching
  // refetches keep the current list visible instead of re-flashing it.
  const status: DashboardAssignmentsStatus = isError
    ? "error"
    : isLoading
      ? "loading"
      : !data || data.length === 0
        ? "empty"
        : "ready";

  const errorMessage = status === "error" ? "Failed to load today's assignments. Please try again." : undefined;

  const assignments = data ?? [];
  const doneCount = assignments.filter((a) => a.remark === "Done").length;

  return { assignments, doneCount, totalCount: assignments.length, status, errorMessage };
}
