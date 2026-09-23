import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { authStorage } from "../../../app/store/auth.storage";
import { resolveQuickRange, type QuickDateFilter } from "../utils/dateRange";
import type { CRQAnalyticsFilterParams } from "../types/crqAnalytics.types";

export const CIRCLE_OPTIONS = ["All", "MH", "KA", "GJ", "DL", "TN", "AP", "WB", "UP-E", "RJ", "MP"];

/** Org-hierarchy scope + circle + date range, combined into the filter params every analytics endpoint expects. */
export function useAnalyticsFilters() {
  const loggedUser = authStorage.getUser();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";

  const { values: orgValues, handleChange: onOrgFilterChange, resetAll: resetOrgFilters } = useOrgHierarchyState("crqAnalytics");
  const { options: orgOptions } = useOrgHierarchyFilters(orgValues);

  const [circle, setCircle] = useState<string>("All");

  const [quickFilter, setQuickFilter] = useState<QuickDateFilter>("30d");
  const [customStart, setCustomStart] = useState<Dayjs | null>(dayjs().subtract(30, "day"));
  const [customEnd, setCustomEnd] = useState<Dayjs | null>(dayjs());

  const { startDate, endDate } = useMemo(() => {
    if (quickFilter === "custom") {
      return {
        startDate: customStart?.isValid() ? customStart.format("YYYY-MM-DD") : dayjs().subtract(30, "day").format("YYYY-MM-DD"),
        endDate: customEnd?.isValid() ? customEnd.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      };
    }
    return resolveQuickRange(quickFilter);
  }, [quickFilter, customStart, customEnd]);

  const filters: CRQAnalyticsFilterParams = useMemo(
    () => ({
      teamFunctionId: orgValues.teamFunction,
      domainId: orgValues.domain,
      subDomainId: orgValues.subDomain,
      circleId: circle === "All" ? undefined : circle,
      startDate,
      endDate,
    }),
    [orgValues, circle, startDate, endDate],
  );

  return {
    roleName,
    orgValues,
    orgOptions,
    onOrgFilterChange,
    resetOrgFilters,
    circle,
    setCircle,
    quickFilter,
    setQuickFilter,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    filters,
  };
}

export type UseAnalyticsFiltersReturn = ReturnType<typeof useAnalyticsFilters>;
