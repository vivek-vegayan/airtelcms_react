/** Change Impact filter value - "" means no filter (all CRQs). */
export type ChangeImpactFilter = "" | "NSA" | "SA";

export const CHANGE_IMPACT_OPTIONS: Array<{ value: Exclude<ChangeImpactFilter, "">; label: string }> = [
  { value: "NSA", label: "Non Service Affecting" },
  { value: "SA", label: "Service Affecting" },
];

/**
 * Normalizes a CRQ's change impact to its code. The column holds either the
 * short code (Plan setup writes "SA"/"NSA") or Remedy's full text
 * ("Service Affecting"/"Non Service Affecting"), so both forms are accepted.
 */
export function changeImpactCode(value: unknown): "NSA" | "SA" | null {
  if (typeof value !== "string") return null;
  const v = value.toUpperCase().replace(/[^A-Z]/g, "");
  if (v === "NSA" || v === "NONSERVICEAFFECTING") return "NSA";
  if (v === "SA" || v === "SERVICEAFFECTING") return "SA";
  return null;
}

/** Keeps only CRQs matching the selected impact; plans left with none are dropped. */
export function filterPlansByChangeImpact<T extends { crqs?: any[] }>(
  plans: T[],
  impact: ChangeImpactFilter,
): T[] {
  if (!impact) return plans;
  return plans
    .map((plan) => ({
      ...plan,
      crqs: (plan.crqs || []).filter(
        (crq) => changeImpactCode(crq.changeImpact ?? crq.remedyChangeImpact) === impact,
      ),
    }))
    .filter((plan) => plan.crqs.length > 0);
}
