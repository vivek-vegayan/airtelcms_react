import { useMemo } from "react";
import moment from "moment";
import { useGetUserMonthlyRosterQuery } from "../api/userMonthlyRosterApi";
import {
  buildDayMetaMap,
  buildMonthStats,
  transformRosterToEvents,
} from "../utils/rosterTransform";
import type {
  CalendarEvent,
  RosterDayMeta,
  RosterMonthStats,
  RosterStatus,
} from "../types/roster.types";

export interface UserRosterMonth {
  events: CalendarEvent[];
  dayMeta: Map<string, RosterDayMeta>;
  stats: RosterMonthStats;
  status: RosterStatus;
  /** Set only when `status === "error"`. */
  errorMessage?: string;
  /** A refetch is in flight while previous data is still on screen. */
  isRefreshing: boolean;
  refetch: () => void;
}

/**
 * Owns the roster query for whatever range the calendar is showing, and
 * resolves it into exactly one of four states.
 *
 * The important distinction — and the bug this fixes — is that a successful
 * response carrying no roster rows is `"empty"`, not `"error"`. The old view
 * only checked `isError || data.status === "Error"`, then rendered a warning
 * banner above the grid, so a perfectly healthy quiet month looked like a
 * failure.
 *
 * The API contract is untouched: same endpoint, same `startDate`/`endDate`
 * params, same response shape.
 */
export function useUserRosterMonth(currentDate: Date): UserRosterMonth {
  // Every view fetches the whole month: Week and Day then read the same
  // cache entry the Month view already holds, so switching views — and
  // moving between days inside one month — costs no extra request.
  const { startDate, endDate } = useMemo(
    () => ({
      startDate: moment(currentDate).startOf("month").format("YYYY-MM-DD"),
      endDate: moment(currentDate).endOf("month").format("YYYY-MM-DD"),
    }),
    [currentDate],
  );

  const { data, isError, isLoading, isFetching, refetch } =
    useGetUserMonthlyRosterQuery({ startDate, endDate });

  const roster = data?.data?.[0]?.roster;
  const failed = isError || data?.status === "Error";

  const status: RosterStatus = failed
    ? "error"
    : // `isLoading` is per cache key and true only while a month has no
      // data yet, so a first visit to a month gets the skeleton while a
      // re-fetch of an already-cached month keeps its grid on screen and
      // shows the thin progress bar instead (`isRefreshing`, below).
      isLoading
      ? "loading"
      : !roster || Object.keys(roster).length === 0
        ? "empty"
        : "ready";

  const events = useMemo<CalendarEvent[]>(
    () => (roster ? transformRosterToEvents(roster) : []),
    [roster],
  );

  const dayMeta = useMemo(() => buildDayMetaMap(roster), [roster]);
  const stats = useMemo(() => buildMonthStats(dayMeta), [dayMeta]);

  return {
    events,
    dayMeta,
    stats,
    status,
    errorMessage: failed
      ? (data?.message ?? "Unable to load roster data. Please try again.")
      : undefined,
    isRefreshing: isFetching && !isLoading,
    refetch,
  };
}
