import type {
  OrgFilterKey,
  OrgFilterValues,
} from "../types/orgHierarchy.types";

/**
 * Defines parent dependency for each filter
 * If parent is not selected → child is disabled
 */
export const ORG_FILTER_DEPENDENCY: Partial<
  Record<OrgFilterKey, OrgFilterKey>
> = {
  teamFunction: "vertical",
  domain: "teamFunction",
  subDomain: "domain",
};

/**
 * Defines reset cascade logic
 * When key changes → remove all children
 */
export const ORG_FILTER_RESET_MAP: Record<
  OrgFilterKey,
  OrgFilterKey[]
> = {
  vertical: ["teamFunction", "domain", "subDomain"],
  teamFunction: ["domain", "subDomain"],
  domain: ["subDomain"],
  subDomain: [],
};
/**
 * Applies one picker change plus its reset cascade, purely.
 *
 * Shared by both halves of useOrgHierarchyState - the local useState path and
 * the Redux (remembered-scope) path - so a screen that remembers its filters
 * cascades exactly like one that does not.
 */
export const applyOrgFilterChange = (
  values: OrgFilterValues,
  key: OrgFilterKey,
  value?: number,
): OrgFilterValues => {
  const next: OrgFilterValues = { ...values, [key]: value };

  if (value === undefined) delete next[key];
  ORG_FILTER_RESET_MAP[key].forEach((child) => {
    delete next[child];
  });

  return next;
};
