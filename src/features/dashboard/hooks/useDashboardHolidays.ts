import { useMemo } from "react";
import { useGetUpcomingHolidaysQuery } from "../api/dashboardApi";
import { buildHolidayDisplay } from "../utils/buildHolidayDisplay";
import type { Holiday } from "../types/dashboard.types";

export type DashboardHolidaysStatus = "loading" | "error" | "empty" | "ready";

export interface DashboardHolidaysState {
  holidays: Holiday[];
  status: DashboardHolidaysStatus;
  errorMessage?: string;
}

/** Owns the dashboard's live "Upcoming holidays" data, backed by /dashboard/upcomingholidays. */
export function useDashboardHolidays(): DashboardHolidaysState {
  const { data, isLoading, isError } = useGetUpcomingHolidaysQuery();

  // isLoading (no cached data yet) drives the skeleton; a background
  // isFetching refetch intentionally does NOT reset status, so previously
  // loaded holidays stay visible instead of flashing back to a skeleton.
  const status: DashboardHolidaysStatus = isError
    ? "error"
    : isLoading
      ? "loading"
      : !data || data.length === 0
        ? "empty"
        : "ready";

  const errorMessage = status === "error" ? "Failed to load upcoming holidays. Please try again." : undefined;

  const holidays = useMemo(() => buildHolidayDisplay(data ?? []), [data]);

  return { holidays, status, errorMessage };
}
