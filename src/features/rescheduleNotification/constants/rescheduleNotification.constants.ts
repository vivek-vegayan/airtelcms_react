import {
  ACTION_STATUS,
  READ_STATUS,
  SORT_OPTION,
  type ActionStatusFilter,
  type ReadStatusFilter,
  type RescheduleNotificationFilters,
  type SortOption,
} from "../types/rescheduleNotification.types";

export const READ_FILTER_OPTIONS: { label: string; value: ReadStatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Unread", value: READ_STATUS.UNREAD },
  { label: "Read", value: READ_STATUS.READ },
];

export const ACTION_FILTER_OPTIONS: { label: string; value: ActionStatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: ACTION_STATUS.PENDING },
  { label: "Approved", value: ACTION_STATUS.APPROVED },
  { label: "Rejected", value: ACTION_STATUS.REJECTED },
];

export const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Latest Requested", value: SORT_OPTION.REQUESTED_DESC },
  { label: "Oldest Requested", value: SORT_OPTION.REQUESTED_ASC },
  { label: "Current Execution Time", value: SORT_OPTION.CURRENT_TIME_ASC },
  { label: "Rescheduled Execution Time", value: SORT_OPTION.RESCHEDULED_TIME_ASC },
];

export const DEFAULT_FILTERS: RescheduleNotificationFilters = {
  search: "",
  readFilter: "ALL",
  actionFilter: "ALL",
  sort: SORT_OPTION.REQUESTED_DESC,
};

export const DEFAULT_PAGE_SIZE = 5;
export const PAGE_SIZE_OPTIONS = [5, 10, 25];

export const SEARCH_DEBOUNCE_MS = 300;
