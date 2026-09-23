import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_FILTERS,
  DEFAULT_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
} from "../constants/rescheduleNotification.constants";
import { rescheduleNotificationMockData } from "../mocks/rescheduleNotification.mock";
import { useApproveCabRescheduleMutation } from "../api/rescheduleNotificationApiSlice";
import {
  type ActionStatusFilter,
  type ReadStatusFilter,
  type RescheduleNotification,
  type SortOption,
} from "../types/rescheduleNotification.types";
import {
  filterRescheduleNotifications,
  getSummaryCounts,
  sortRescheduleNotifications,
} from "../utils/rescheduleNotification.utils";

/**
 * Feature state layer for the Reschedule Notification dashboard.
 * Backed by static mock data today; swapping the source for RTK Query
 * endpoints later only touches this hook — page/components stay unchanged.
 */
export function useRescheduleNotifications() {
  const [notifications, setNotifications] = useState<RescheduleNotification[]>(
    () => [...rescheduleNotificationMockData],
  );

  const [approveCabReschedule] = useApproveCabRescheduleMutation();

  const [searchInput, setSearchInput] = useState(DEFAULT_FILTERS.search);
  const [debouncedSearch, setDebouncedSearch] = useState(DEFAULT_FILTERS.search);
  const [readFilter, setReadFilterState] = useState<ReadStatusFilter>(DEFAULT_FILTERS.readFilter);
  const [actionFilter, setActionFilterState] = useState<ActionStatusFilter>(
    DEFAULT_FILTERS.actionFilter,
  );
  const [sort, setSortState] = useState<SortOption>(DEFAULT_FILTERS.sort);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const setReadFilter = (value: ReadStatusFilter) => {
    setReadFilterState(value);
    setPage(0);
  };

  const setActionFilter = (value: ActionStatusFilter) => {
    setActionFilterState(value);
    setPage(0);
  };

  const setSort = (value: SortOption) => {
    setSortState(value);
    setPage(0);
  };

  const summaryCounts = useMemo(() => getSummaryCounts(notifications), [notifications]);

  const filteredAndSorted = useMemo(() => {
    const filtered = filterRescheduleNotifications(notifications, {
      search: debouncedSearch,
      readFilter,
      actionFilter,
    });
    return sortRescheduleNotifications(filtered, sort);
  }, [notifications, debouncedSearch, readFilter, actionFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const paginated = useMemo(
    () => filteredAndSorted.slice(page * pageSize, page * pageSize + pageSize),
    [filteredAndSorted, page, pageSize],
  );

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && n.readStatus === "UNREAD" ? { ...n, readStatus: "READ" } : n)),
    );
  };

  const approve = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target) return;

    await approveCabReschedule({
      crqNo: target.crqNo,
      slotStart: target.rescheduledExecutionTime,
      slotEnd: target.rescheduledExecutionEndTime,
    }).unwrap();

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, actionStatus: "APPROVED", readStatus: "READ" } : n,
      ),
    );
  };

  const reject = (id: string, reason: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, actionStatus: "REJECTED", readStatus: "READ", rejectionReason: reason }
          : n,
      ),
    );
  };

  const resetFilters = () => {
    setSearchInput(DEFAULT_FILTERS.search);
    setDebouncedSearch(DEFAULT_FILTERS.search);
    setReadFilterState(DEFAULT_FILTERS.readFilter);
    setActionFilterState(DEFAULT_FILTERS.actionFilter);
    setSortState(DEFAULT_FILTERS.sort);
    setPage(0);
    setPageSize(DEFAULT_PAGE_SIZE);
  };

  const filterByUnread = () => {
    setReadFilterState("UNREAD");
    setActionFilterState("ALL");
    setPage(0);
  };

  const filterByAction = (status: ActionStatusFilter) => {
    setActionFilterState(status);
    setReadFilterState("ALL");
    setPage(0);
  };

  const filterAll = () => {
    setReadFilterState("ALL");
    setActionFilterState("ALL");
    setPage(0);
  };

  return {
    isLoading: false as boolean,
    error: null as string | null,

    notifications: paginated,
    totalCount: filteredAndSorted.length,
    summaryCounts,

    search: searchInput,
    setSearch: setSearchInput,
    readFilter,
    setReadFilter,
    actionFilter,
    setActionFilter,
    sort,
    setSort,

    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,

    markAsRead,
    approve,
    reject,
    resetFilters,
    filterByUnread,
    filterByAction,
    filterAll,
  };
}

export type UseRescheduleNotificationsResult = ReturnType<typeof useRescheduleNotifications>;
