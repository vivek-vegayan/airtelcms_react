import { useMemo } from "react";
import { format } from "date-fns";
import { useGetWorkLocationQuery } from "../api/dashboardApi";
import type { EmpWorkLocationRow } from "../types/dashboard.types";

export type DashboardWorkLocationStatus = "loading" | "error" | "empty" | "ready";

export interface DashboardWorkLocationState {
  location?: EmpWorkLocationRow;
  status: DashboardWorkLocationStatus;
  errorMessage?: string;
}

/** Owns the dashboard's live "Work location" data, backed by /dashboard/worklocation. */
export function useDashboardWorkLocation(): DashboardWorkLocationState {
  const date = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const { data, isLoading, isFetching, isError } = useGetWorkLocationQuery({ date });

  const status: DashboardWorkLocationStatus = isError
    ? "error"
    : isLoading || isFetching
      ? "loading"
      : !data || data.length === 0
        ? "empty"
        : "ready";

  const errorMessage = status === "error" ? "Failed to load your work location. Please try again." : undefined;

  return { location: data?.[0], status, errorMessage };
}
