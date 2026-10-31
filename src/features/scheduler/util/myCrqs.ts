import type { Crq } from "../types/crqWorkflow.types";
import { getStageConfig } from "../constants/stageConfig";
import type { StageKey } from "../types/stageWorkflow.types";
import { WORKFLOW_STAGES, resolveCurrentStageIndex } from "../constants/workflowStages";

/**
 * CRQ field holding the OLM id assigned to the CRQ's current stage:
 * olmidReview for Plan & Inventory, otherwise the stage config's olmIdField
 * (olmidSchedulingApproval, olmidExecution, olmidClosure, ...).
 */
export function currentStageOlmIdField(crq: Crq): string {
  const stage = WORKFLOW_STAGES[resolveCurrentStageIndex(crq)];
  return stage.id === "review" ? "olmidReview" : getStageConfig(stage.id as StageKey).olmIdField;
}

const normalizeOlmId = (value: unknown) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

/** True when the CRQ's current stage is assigned to this OLM id. */
export function isCurrentStageAssignedTo(crq: Crq, olmId: string | null | undefined): boolean {
  const me = normalizeOlmId(olmId);
  if (!me) return false;
  return normalizeOlmId((crq as Record<string, unknown>)[currentStageOlmIdField(crq)]) === me;
}

/** "My CRQs": keeps only CRQs whose current stage is assigned to the user; plans left with none are dropped. */
export function filterPlansByMyCurrentStage<T extends { crqs?: any[] }>(
  plans: T[],
  enabled: boolean,
  olmId: string | null | undefined,
): T[] {
  if (!enabled) return plans;
  return plans
    .map((plan) => ({
      ...plan,
      crqs: (plan.crqs || []).filter((crq) => isCurrentStageAssignedTo(crq, olmId)),
    }))
    .filter((plan) => plan.crqs.length > 0);
}
