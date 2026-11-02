import type {
  OrgFilterValues,
  OrgHierarchyResponse,
} from "../../orgHierarchy/types/orgHierarchy.types";

/**
 * Org scope the analytics pages open on when nothing is selected yet: the
 * first Vertical, the first Team Function under it, the second Domain under
 * that (the first when there is only one), and no Sub Domain, which is sent as
 * the ALL id 0. Returns undefined until the hierarchy has loaded.
 */
export const resolveDefaultOrgScope = (
  hierarchy: OrgHierarchyResponse["data"] | undefined,
): OrgFilterValues | undefined => {
  if (!hierarchy) return undefined;
  const { verticals, teamFunction, domains } = hierarchy;

  const vertical = verticals[0]?.id;
  if (vertical === undefined) return undefined;

  const fn = teamFunction.find((f) => f.verticalId === vertical)?.id;
  const fnDomains = domains.filter((d) => d.functionId === fn);
  const domain = (fnDomains[1] ?? fnDomains[0])?.id;

  return { vertical, teamFunction: fn, domain };
};
