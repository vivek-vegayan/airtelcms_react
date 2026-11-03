const normalizeOlmId = (value: unknown) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

/** True when the CRQ's `olmIdField` (the listing tab's own OLM id column) holds this OLM id. */
export function isAssignedTo(crq: unknown, olmIdField: string, olmId: string | null | undefined): boolean {
  const me = normalizeOlmId(olmId);
  if (!me) return false;
  return normalizeOlmId((crq as Record<string, unknown>)?.[olmIdField]) === me;
}

/**
 * "My CRQs": keeps only CRQs whose `olmIdField` is assigned to the user;
 * plans left with none are dropped. Each tab passes its own column
 * (olmidReview for Plan & Inventory, otherwise the stage config's
 * olmIdField), regardless of the CRQ's currentStage.
 */
export function filterPlansByMyCrqs<T extends { crqs?: any[] }>(
  plans: T[],
  enabled: boolean,
  olmIdField: string,
  olmId: string | null | undefined,
): T[] {
  if (!enabled) return plans;
  return plans
    .map((plan) => ({
      ...plan,
      crqs: (plan.crqs || []).filter((crq) => isAssignedTo(crq, olmIdField, olmId)),
    }))
    .filter((plan) => plan.crqs.length > 0);
}
