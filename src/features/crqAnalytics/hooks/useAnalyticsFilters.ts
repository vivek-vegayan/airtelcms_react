import { useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useGetOrgHierarchyByUserQuery } from "../../orgHierarchy/api/orgHierarchy.api";
import { useAuth } from "../../auth/hooks/useAuth";
import { resolveQuickRange, type QuickDateFilter } from "../utils/dateRange";
import { resolveDefaultOrgScope } from "../utils/defaultOrgScope";
import type { CRQAnalyticsFilterParams } from "../types/crqAnalytics.types";

/** Org-hierarchy scope + circle + date range, combined into the filter params every analytics endpoint expects. */
export function useAnalyticsFilters() {
  const { user: loggedUser } = useAuth();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";

  const {
    values: orgValues,
    setValues: setOrgValues,
    handleChange: onOrgFilterChange,
    resetAll: resetOrgFilters,
  } = useOrgHierarchyState("crqAnalytics");
  const { options: hierarchyOptions } = useOrgHierarchyFilters(orgValues);
  // The filter bar adds its own "All" Sub Domain entry, so the backend's
  // catch-all row (id 0) is dropped here.
  const orgOptions = useMemo(
    () => ({ ...hierarchyOptions, subDomain: hierarchyOptions.subDomain.filter((o) => o.value !== 0) }),
    [hierarchyOptions],
  );

  // Nothing selected yet (first open, or after reset) → open on the default
  // scope, Sub Domain left on All. Same RTK Query cache as the pickers, no extra request.
  const { data: hierarchy } = useGetOrgHierarchyByUserQuery();
  useEffect(() => {
    if (Object.keys(orgValues).length > 0) return;
    const scope = resolveDefaultOrgScope(hierarchy?.data);
    if (scope) setOrgValues(scope);
  }, [hierarchy, orgValues, setOrgValues]);

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
      // No Sub Domain is the bar's "All" entry, sent as the backend's ALL id 0.
      subDomainId: orgValues.subDomain ?? 0,
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
