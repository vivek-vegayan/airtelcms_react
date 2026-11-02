import type {
  OrgFilterKey,
  OrgFilterOption,
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

/**
 * The next level to pre-select because the user's access leaves it exactly
 * one option, or undefined when there is nothing to fill.
 *
 * `levels` is the top-down list of pickers the user can see. Only the first
 * fillable level is returned: picking it re-filters the options below, so the
 * caller fills one level per pass and asks again.
 */
export const findSingleOptionLevel = (
  levels: OrgFilterKey[],
  values: OrgFilterValues,
  options: Record<OrgFilterKey, OrgFilterOption[]>,
): { key: OrgFilterKey; value: number } | undefined => {
  const key = levels.find(
    (k) => values[k] === undefined && options[k].length === 1,
  );
  return key ? { key, value: options[key][0].value } : undefined;
};
