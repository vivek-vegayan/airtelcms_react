import type { LeaveStatus } from "../types/leave.types";

// ─── Date Formatting ──────────────────────────────────────────────────────────

export const formatLeaveDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatDateRange = (start: string, end: string): string =>
  start === end
    ? formatLeaveDate(start)
    : `${formatLeaveDate(start)} – ${formatLeaveDate(end)}`;

// ─── Status Helpers ───────────────────────────────────────────────────────────

type ChipColor = "success" | "error" | "warning" | "default";

const STATUS_COLOR_MAP: Record<string, ChipColor> = {
  APPROVED: "success",
  REJECTED: "error",
  PENDING: "warning",
};

export const getStatusChipColor = (status: string): ChipColor =>
  STATUS_COLOR_MAP[status?.toUpperCase()] ?? "default";

// ─── Normalise ────────────────────────────────────────────────────────────────

export const normaliseStatus = (status: string): Uppercase<LeaveStatus> =>
  status?.toUpperCase() as Uppercase<LeaveStatus>;