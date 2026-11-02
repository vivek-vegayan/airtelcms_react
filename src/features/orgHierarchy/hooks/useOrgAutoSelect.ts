import { useEffect, useMemo } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { findSingleOptionLevel } from "../config/orgFilterDependency";
import { getOrgFilterVisibility } from "../config/orgFilterVisibility";
import type {
  OrgFilterKey,
  OrgFilterOption,
  OrgFilterValues,
} from "../types/orgHierarchy.types";

/**
 * Pre-selects every visible org-hierarchy level the user's access narrows to a
 * single option, so a user scoped to one Sub Domain opens the screen already
 * filtered to it instead of clicking through four one-item dropdowns.
 *
 * Pair it with useOrgHierarchyState + useOrgHierarchyFilters and pass the raw
 * change handler. Only visible levels are filled - a hidden level stays unset,
 * which is what role-aware scoping (e.g. scheduler/util/orgScope.ts) expects.
 * Reset or a cleared picker is refilled on the next pass, so a one-option
 * level always reads as the user's own scope.
 */
export const useOrgAutoSelect = (
  values: OrgFilterValues,
  options: Record<OrgFilterKey, OrgFilterOption[]>,
  onChange: (key: OrgFilterKey, value?: number) => void,
) => {
  const { user } = useAuth();
  const visible = useMemo(
    () => getOrgFilterVisibility(user?.roleCode),
    [user],
  );

  useEffect(() => {
    const next = findSingleOptionLevel(visible, values, options);
    if (next) onChange(next.key, next.value);
  }, [visible, values, options, onChange]);
};
