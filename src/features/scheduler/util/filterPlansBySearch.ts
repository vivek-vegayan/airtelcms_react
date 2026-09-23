import { deepSearch } from "./stringUtils";

/**
 * Filters a list of plans (each containing a `crqs` array) by a free-text
 * global search term, matching against plan-level and CRQ-level fields.
 * Identical logic was duplicated per-stage in the original implementation -
 * now shared by every GenericStagePage instance.
 */
export function filterPlansBySearch<T extends { crqs?: any[] }>(
  plans: T[],
  searchTerm: string,
): T[] {
  if (!searchTerm) return plans;
  const term = searchTerm.trim();

  return plans
    .map((plan) => {
      const planMatches = deepSearch(plan, term);
      const crqs = (plan.crqs || []).filter((crq) => deepSearch(crq, term));
      if (!planMatches && !crqs.length) return null;
      return { ...plan, crqs: term ? crqs : plan.crqs };
    })
    .filter(Boolean) as T[];
}
