import {
  STAGE_ENUM_TO_ID,
  WORKFLOW_STAGES,
  type WorkflowStageId,
} from "../constants/workflowStages";
import type { CrqGlobalSearchHit } from "../api/crqGlobalSearchApiSlice";
import type { OrgFilterValues } from "../../orgHierarchy/types/orgHierarchy.types";
import type { OrgHierarchyResponse } from "../../orgHierarchy/types/orgHierarchy.types";

/**
 * Turns a Global CRQ Search hit into "which of the 7 workflow steps should we
 * show, and with which org filters" - without ever guessing.
 *
 * Every failure mode gets its own outcome so the UI can say what actually went
 * wrong instead of silently landing the user on step 1 (which would look like
 * a successful search and quietly misinform them about the CRQ's real stage).
 */

/** Why a hit could not be routed. */
export type StageRouteFailure =
  | "missing-stage" // backend returned no current_stage at all
  | "unknown-stage" // current_stage is a value the 7-stage map doesn't know
  | "missing-scope" // no domain/sub-domain ids, so no page could be targeted
  | "out-of-scope"; // the CRQ's scope isn't in this user's org hierarchy

export interface StageRouteSuccess {
  ok: true;
  /** 0-based index into WORKFLOW_STEPS / WORKFLOW_STAGES. */
  stepIndex: number;
  stageId: WorkflowStageId;
  stageLabel: string;
  /** Complete filter-bar values (vertical -> subDomain) targeting the CRQ. */
  filters: OrgFilterValues;
}

export interface StageRouteFailureResult {
  ok: false;
  reason: StageRouteFailure;
  message: string;
}

export type StageRouteResult = StageRouteSuccess | StageRouteFailureResult;

/**
 * Resolves the CRQ's stage index from its raw `currentStage` enum.
 *
 * Deliberately goes through the existing STAGE_ENUM_TO_ID -> WORKFLOW_STAGES
 * pair rather than a private copy of the ordering, so this can never disagree
 * with the stage rail, the sidebar or the stepper. Returns -1 for an enum the
 * map doesn't cover (e.g. a stage added to the DB but not yet to the UI),
 * which the caller surfaces as "unknown stage" rather than defaulting to 0.
 */
export function resolveStageIndexFromEnum(
  currentStage: string | null | undefined,
): number {
  if (!currentStage) return -1;
  const stageId = STAGE_ENUM_TO_ID[currentStage];
  if (!stageId) return -1;
  return WORKFLOW_STAGES.findIndex((s) => s.id === stageId);
}

/**
 * Walks the CRQ's sub-domain back up the org hierarchy the *current user* is
 * entitled to (the payload behind the filter bar), producing the full
 * vertical -> teamFunction -> domain -> subDomain chain.
 *
 * Using the user's own hierarchy as the lookup table doubles as an access
 * check: a CRQ in a domain the user has no hierarchy entry for cannot be
 * routed to, because there is no filter-bar state that would ever show it.
 * Returns null in that case.
 */
export function resolveOrgFiltersForCrq(
  hit: Pick<CrqGlobalSearchHit, "domainId" | "subDomainId">,
  org: OrgHierarchyResponse["data"] | undefined,
): OrgFilterValues | null {
  if (hit.domainId == null || hit.subDomainId == null) return null;
  if (!org) return null;

  const subDomain = org.subDomains?.find((sd) => sd.id === hit.subDomainId);
  const domain = org.domains?.find((d) => d.id === hit.domainId);
  if (!subDomain || !domain) return null;

  const teamFunction = org.teamFunction?.find((f) => f.id === domain.functionId);
  const vertical = teamFunction
    ? org.verticals?.find((v) => v.id === teamFunction.verticalId)
    : undefined;

  // vertical/teamFunction are filled in when resolvable so the filter bar
  // reads coherently, but their absence is not fatal: a role that is never
  // shown those pickers (see ORG_FILTER_VISIBILITY) still routes on
  // domain + subDomain, which is all the stage queries actually use.
  return {
    ...(vertical ? { vertical: vertical.id } : {}),
    ...(teamFunction ? { teamFunction: teamFunction.id } : {}),
    domain: domain.id,
    subDomain: subDomain.id,
  };
}

/**
 * Full resolution: stage + filters, or a specific reason it can't be done.
 * The caller never has to invent a fallback destination.
 */
export function resolveCrqRoute(
  hit: CrqGlobalSearchHit,
  org: OrgHierarchyResponse["data"] | undefined,
): StageRouteResult {
  if (!hit.currentStage) {
    return {
      ok: false,
      reason: "missing-stage",
      message: `${hit.crqNo} came back without a workflow stage, so it can't be opened. Please refresh and try again.`,
    };
  }

  const stepIndex = resolveStageIndexFromEnum(hit.currentStage);
  if (stepIndex < 0) {
    return {
      ok: false,
      reason: "unknown-stage",
      message: `${hit.crqNo} is in stage "${hit.currentStage}", which this workflow doesn't have a page for.`,
    };
  }

  if (hit.domainId == null || hit.subDomainId == null) {
    return {
      ok: false,
      reason: "missing-scope",
      message: `${hit.crqNo} has no domain / sub-domain set, so its stage page can't be opened.`,
    };
  }

  const filters = resolveOrgFiltersForCrq(hit, org);
  if (!filters) {
    return {
      ok: false,
      reason: "out-of-scope",
      message: `${hit.crqNo} sits in ${hit.domainName ?? "another domain"}${
        hit.subDomainName ? ` / ${hit.subDomainName}` : ""
      }, which isn't in your access scope.`,
    };
  }

  const stage = WORKFLOW_STAGES[stepIndex];
  return {
    ok: true,
    stepIndex,
    stageId: stage.id,
    stageLabel: stage.label,
    filters,
  };
}
