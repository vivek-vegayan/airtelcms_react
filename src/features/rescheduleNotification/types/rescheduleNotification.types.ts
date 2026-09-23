export const READ_STATUS = {
  READ: "READ",
  UNREAD: "UNREAD",
} as const;

export type ReadStatus = (typeof READ_STATUS)[keyof typeof READ_STATUS];

export const ACTION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ActionStatus = (typeof ACTION_STATUS)[keyof typeof ACTION_STATUS];

export interface RescheduleNotification {
  id: string;
  crqNo: string;
  /** ISO 8601 timestamp */
  currentExecutionTime: string;
  /** ISO 8601 timestamp */
  rescheduledExecutionTime: string;
  /** ISO 8601 timestamp - end of the proposed execution window, sent to the approve API as slotEnd */
  rescheduledExecutionEndTime: string;
  readStatus: ReadStatus;
  actionStatus: ActionStatus;
  /** ISO 8601 timestamp */
  requestedAt: string;
  rejectionReason?: string;
}

export type ReadStatusFilter = "ALL" | ReadStatus;
export type ActionStatusFilter = "ALL" | ActionStatus;

export const SORT_OPTION = {
  REQUESTED_DESC: "REQUESTED_DESC",
  REQUESTED_ASC: "REQUESTED_ASC",
  CURRENT_TIME_ASC: "CURRENT_TIME_ASC",
  RESCHEDULED_TIME_ASC: "RESCHEDULED_TIME_ASC",
} as const;

export type SortOption = (typeof SORT_OPTION)[keyof typeof SORT_OPTION];

export interface RescheduleNotificationFilters {
  search: string;
  readFilter: ReadStatusFilter;
  actionFilter: ActionStatusFilter;
  sort: SortOption;
}

export interface RescheduleSummaryCounts {
  total: number;
  unread: number;
  pending: number;
  approved: number;
  rejected: number;
}

export type TimeShiftDirection = "EARLIER" | "LATER" | "SAME";

export interface ExecutionTimeComparison {
  direction: TimeShiftDirection;
  diffLabel: string;
  isSameDay: boolean;
}
