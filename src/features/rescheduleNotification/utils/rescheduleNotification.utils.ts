import { differenceInMinutes, format, isSameDay } from "date-fns";
import {
  SORT_OPTION,
  type ExecutionTimeComparison,
  type RescheduleNotification,
  type RescheduleNotificationFilters,
  type RescheduleSummaryCounts,
  type SortOption,
} from "../types/rescheduleNotification.types";

export function formatExecutionTime(iso: string): string {
  return format(new Date(iso), "dd MMM yyyy, hh:mm a");
}

function formatMinuteDiff(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function compareExecutionTimes(
  currentExecutionTime: string,
  rescheduledExecutionTime: string,
): ExecutionTimeComparison {
  const current = new Date(currentExecutionTime);
  const rescheduled = new Date(rescheduledExecutionTime);
  const diffMinutes = differenceInMinutes(rescheduled, current);
  const sameDay = isSameDay(current, rescheduled);

  if (diffMinutes === 0) {
    return { direction: "SAME", diffLabel: "No change", isSameDay: sameDay };
  }

  const direction = diffMinutes > 0 ? "LATER" : "EARLIER";
  const diffLabel = `Moved ${formatMinuteDiff(Math.abs(diffMinutes))} ${
    direction === "LATER" ? "later" : "earlier"
  }`;

  return { direction, diffLabel, isSameDay: sameDay };
}

export function filterRescheduleNotifications(
  notifications: readonly RescheduleNotification[],
  filters: Pick<RescheduleNotificationFilters, "search" | "readFilter" | "actionFilter">,
): RescheduleNotification[] {
  const trimmedSearch = filters.search.trim().toLowerCase();

  return notifications.filter((notification) => {
    if (trimmedSearch && !notification.crqNo.toLowerCase().includes(trimmedSearch)) {
      return false;
    }
    if (filters.readFilter !== "ALL" && notification.readStatus !== filters.readFilter) {
      return false;
    }
    if (filters.actionFilter !== "ALL" && notification.actionStatus !== filters.actionFilter) {
      return false;
    }
    return true;
  });
}

export function sortRescheduleNotifications(
  notifications: readonly RescheduleNotification[],
  sort: SortOption,
): RescheduleNotification[] {
  const sorted = [...notifications];

  switch (sort) {
    case SORT_OPTION.REQUESTED_ASC:
      return sorted.sort(
        (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime(),
      );
    case SORT_OPTION.CURRENT_TIME_ASC:
      return sorted.sort(
        (a, b) =>
          new Date(a.currentExecutionTime).getTime() -
          new Date(b.currentExecutionTime).getTime(),
      );
    case SORT_OPTION.RESCHEDULED_TIME_ASC:
      return sorted.sort(
        (a, b) =>
          new Date(a.rescheduledExecutionTime).getTime() -
          new Date(b.rescheduledExecutionTime).getTime(),
      );
    case SORT_OPTION.REQUESTED_DESC:
    default:
      return sorted.sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      );
  }
}

export function getSummaryCounts(
  notifications: readonly RescheduleNotification[],
): RescheduleSummaryCounts {
  return notifications.reduce<RescheduleSummaryCounts>(
    (counts, notification) => {
      counts.total += 1;
      if (notification.readStatus === "UNREAD") counts.unread += 1;
      if (notification.actionStatus === "PENDING") counts.pending += 1;
      if (notification.actionStatus === "APPROVED") counts.approved += 1;
      if (notification.actionStatus === "REJECTED") counts.rejected += 1;
      return counts;
    },
    { total: 0, unread: 0, pending: 0, approved: 0, rejected: 0 },
  );
}
