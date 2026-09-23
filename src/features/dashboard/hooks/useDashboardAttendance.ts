import { toast } from "react-toastify";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetTodayAttendanceQuery,
  useSetWorkModeMutation,
} from "../api/dashboardApi";
import type { AttendanceRow, WorkMode } from "../types/dashboard.types";

function reportAttendanceError(err: unknown, fallback: string) {
  const message = (err as { data?: { message?: string } })?.data?.message;
  toast.error(message || fallback);
}

export type DashboardAttendanceStatus = "loading" | "error" | "empty" | "ready";

export interface DashboardAttendanceState {
  attendance?: AttendanceRow | null;
  status: DashboardAttendanceStatus;
  errorMessage?: string;
  isMutating: boolean;
  setWorkMode: (mode: WorkMode) => void;
  clockIn: (mode?: WorkMode) => void;
  clockOut: () => void;
}

/** Owns the dashboard's live WFH/WFO + clock-in/out attendance widget, backed by /attendance/*. */
export function useDashboardAttendance(): DashboardAttendanceState {
  const { data, isLoading, isError } = useGetTodayAttendanceQuery();
  const [triggerSetWorkMode, setWorkModeState] = useSetWorkModeMutation();
  const [triggerClockIn, clockInState] = useClockInMutation();
  const [triggerClockOut, clockOutState] = useClockOutMutation();

  // isLoading (no cached data yet) drives the skeleton; a background
  // isFetching refetch (e.g. after clock-in/out invalidates the query) keeps
  // the current attendance state visible instead of re-flashing it — the
  // clock-in/out buttons already have their own `isMutating` pending state.
  const status: DashboardAttendanceStatus = isError
    ? "error"
    : isLoading
      ? "loading"
      : !data
        ? "empty"
        : "ready";

  const errorMessage = status === "error" ? "Failed to load today's attendance. Please try again." : undefined;

  return {
    attendance: data,
    status,
    errorMessage,
    isMutating: setWorkModeState.isLoading || clockInState.isLoading || clockOutState.isLoading,
    setWorkMode: (mode) => {
      triggerSetWorkMode(mode)
        .unwrap()
        .catch((err) => reportAttendanceError(err, "Failed to update work mode. Please try again."));
    },
    clockIn: (mode) => {
      triggerClockIn(mode)
        .unwrap()
        .then(() => toast.success("🎉 Welcome back! Your attendance has started successfully."))
        .catch((err) => reportAttendanceError(err, "Failed to clock in. Please try again."));
    },
    clockOut: () => {
      triggerClockOut()
        .unwrap()
        .then(() => toast.success("👏 Great work! Your attendance has been recorded successfully."))
        .catch((err) => reportAttendanceError(err, "Failed to clock out. Please try again."));
    },
  };
}
