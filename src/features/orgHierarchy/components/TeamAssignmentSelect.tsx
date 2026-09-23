import { memo, useEffect } from "react";
import { Box } from "@mui/material";
import { authStorage } from "../../../app/store/auth.storage";
import { useGetOrgHierarchyByUserQuery } from "../api/orgHierarchy.api";
import { useOrgHierarchyState } from "../hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../hooks/useOrgHierarchyFilters";
import { getOrgFilterVisibility } from "../config/orgFilterVisibility";
import { ORG_FILTER_DEPENDENCY } from "../config/orgFilterDependency";
import type { OrgFilterKey } from "../types/orgHierarchy.types";
import OrgFilterSelect from "./OrgFilterSelect";

const LABELS: Record<OrgFilterKey, string> = {
  vertical: "Vertical",
  teamFunction: "Team Function",
  domain: "Domain",
  subDomain: "Sub Domain",
};

interface Props {
  /** The currently assigned sub-domain id ("team"), or undefined/null if unassigned. */
  value?: number | null;
  /** Fires with the newly selected sub-domain id, or undefined when it's cleared/invalidated. */
  onChange: (subDomainId?: number) => void;
  disabled?: boolean;
}

/**
 * Vertical → Team Function → Domain → Sub Domain cascading picker for
 * "Assign Team". Which levels render is driven entirely by the logged-in
 * user's "Organization Hierarchy" grants (see getOrgFilterVisibility), and the
 * options at every level are already scoped server-side to that user by
 * GET /users/V1/getOrgHierarchyByUser — nothing here is hardcoded per role or
 * per screen.
 */
const TeamAssignmentSelect = ({ value, onChange, disabled }: Props) => {
  const roleName = authStorage.getUser()?.roleCode ?? "TEAM_MEMBER";
  const rawVisible = getOrgFilterVisibility(roleName);
  // "Team" is always stored as a sub-domain id, so the cascade must always be
  // able to reach that leaf even if a role's search-filter visibility list
  // (shared with the plan list's filter bar) stops short.
  const visible = rawVisible.includes("subDomain")
    ? rawVisible
    : [...rawVisible, "subDomain"];

  const { data } = useGetOrgHierarchyByUserQuery();
  const { values, setValues, handleChange } = useOrgHierarchyState();
  const { options } = useOrgHierarchyFilters(values);

  // Resolve the ancestor chain for an already-assigned sub-domain so the
  // cascade shows the right vertical/function/domain instead of an empty form.
  useEffect(() => {
    if (!value || !data?.data || values.subDomain === value) return;
    const { domains, teamFunction, subDomains } = data.data;
    const sd = subDomains.find((s) => s.id === value);
    const dom = sd ? domains.find((d) => d.id === sd.domainId) : undefined;
    const fn = dom ? teamFunction.find((f) => f.id === dom.functionId) : undefined;
    setValues({
      subDomain: value,
      domain: sd?.domainId,
      teamFunction: fn?.id,
      vertical: fn?.verticalId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, data]);

  const handleFilterChange = (key: OrgFilterKey, v?: number) => {
    handleChange(key, v);
    // Selecting the leaf level assigns the team; changing any parent level
    // invalidates the previous leaf selection until a new one is made.
    onChange(key === "subDomain" ? v : undefined);
  };

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {visible.map((key) => {
        const parentKey = ORG_FILTER_DEPENDENCY[key];
        const parentUnresolved =
          !!parentKey && visible.includes(parentKey) && !values[parentKey];

        return (
          <OrgFilterSelect
            key={key}
            label={LABELS[key]}
            value={values[key]}
            // An activity belongs to one real team, never the "ALL" (id 0)
            // catch-all that the search filters offer.
            options={
              key === "subDomain"
                ? options.subDomain.filter((o) => o.value !== 0)
                : options[key]
            }
            disabled={disabled || parentUnresolved}
            onChange={(v) => handleFilterChange(key, v)}
          />
        );
      })}
    </Box>
  );
};

export default memo(TeamAssignmentSelect);
