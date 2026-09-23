import { useMemo } from "react";
import { useGetEmployeesOnLeaveQuery } from "../api/dashboardApi";
import { buildLeaveTeamDisplay } from "../utils/buildLeaveTeamDisplay";
import type { LeaveTeamMember } from "../types/dashboard.types";

export type DashboardLeaveTeamStatus = "loading" | "error" | "empty" | "ready";

export interface DashboardLeaveTeamState {
  team: LeaveTeamMember[];
  status: DashboardLeaveTeamStatus;
  errorMessage?: string;
}

/** Owns the dashboard's live "On leave today" data, backed by /dashboard/employeesonleave. */
export function useDashboardLeaveTeam(): DashboardLeaveTeamState {
  const { data, isLoading, isError } = useGetEmployeesOnLeaveQuery();

  // isLoading (no cached data yet) drives the skeleton; background isFetching
  // refetches keep the last-known team visible instead of re-flashing it.
  const status: DashboardLeaveTeamStatus = isError
    ? "error"
    : isLoading
      ? "loading"
      : !data || data.length === 0
        ? "empty"
        : "ready";

  const errorMessage = status === "error" ? "Failed to load employees on leave. Please try again." : undefined;

  const team = useMemo(() => buildLeaveTeamDisplay(data ?? []), [data]);

  return { team, status, errorMessage };
}
