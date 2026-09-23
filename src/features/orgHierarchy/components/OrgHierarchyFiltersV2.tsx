import { Box } from "@mui/material";
import { useMemo } from "react";
import RefreshIconButton from "../../../components/ui/RefreshIconButton";
import { getOrgFilterVisibility } from "../config/orgFilterVisibility";
import { ORG_FILTER_DEPENDENCY } from "../config/orgFilterDependency";
import type {
  OrgFilterKey,
  OrgFilterValues,
  OrgFilterOption,
} from "../types/orgHierarchy.types";
import OrgFilterSelect from "./OrgFilterSelect";

const LABELS: Record<OrgFilterKey, string> = {
  vertical: "Vertical",
  teamFunction: "Team Function",
  domain: "Domain",
  subDomain: "Sub Domain",
};

interface Props {
  role: string;
  values: OrgFilterValues;
  options: Record<OrgFilterKey, OrgFilterOption[]>;
  onChange: (key: OrgFilterKey, value?: number) => void;
  /**
   * Renders a refresh button directly after the last picker, which re-runs the
   * screen's own API calls for the scope currently selected. Omit it on screens
   * that have nothing of their own to refetch. See hooks/useApiRefresh.
   */
  onRefresh?: () => void;
  /** Spins the refresh icon while the refetch it started is still in flight. */
  isRefreshing?: boolean;
  /** Set when the current scope isn't complete enough to fetch anything yet. */
  refreshDisabled?: boolean;
  refreshTooltip?: string;
  children?: React.ReactNode;
}


const OrgHierarchyFilters = ({
  role,
  values,
  options,
  onChange,
  onRefresh,
  isRefreshing = false,
  refreshDisabled = false,
  refreshTooltip,
  children,
}: Props) => {
  // Driven by the user's real "Organization Hierarchy" sub-module grants, with
  // the legacy per-role table as fallback - see getOrgFilterVisibility.
  const visible = useMemo(() => getOrgFilterVisibility(role), [role]);

  return (
    <Box display="flex" gap={2} alignItems="center">
      {visible.map((key) => {
        const parentKey = ORG_FILTER_DEPENDENCY[key];

        const disabled =
          parentKey &&
          visible.includes(parentKey) &&
          !values[parentKey];

        return (
          <OrgFilterSelect
            key={key}
            label={LABELS[key]}
            value={values[key]}
            options={options[key]}
            disabled={disabled}
            onChange={(v) => onChange(key, v)}
          />
        );
      })}

      {onRefresh && (
        <RefreshIconButton
          onClick={onRefresh}
          busy={isRefreshing}
          disabled={refreshDisabled}
          title={refreshTooltip ?? "Refresh data"}
          sx={{ flexShrink: 0 }}
        />
      )}

      {children}
    </Box>
  );
};
export default OrgHierarchyFilters;
