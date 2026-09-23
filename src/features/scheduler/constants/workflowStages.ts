import { format } from "date-fns";
import type { Crq } from "../types/crqWorkflow.types";
import type { StageKey } from "../types/stageWorkflow.types";
import { getStageConfig } from "./stageConfig";

/**
 * The 7-stage identifier used by the CRQ workflow cockpit (CrqDetailedView).
 * "review" is the Plan & Inventory stage - it predates the generic
 * StageConfig map and still runs on its own endpoints (crqreviewApiSlice /
 * schedulerApiSlice), so it isn't a StageKey. The other six map 1:1 to
 * StageKey and are resolved through constants/stageConfig.ts.
 */
export type WorkflowStageId = "review" | StageKey;

export type StageRunState =
  | "completed"
  | "in_progress"
  | "failed"
  | "canceled"
  | "locked"
  | "not_started";

export interface WorkflowStageDescriptor {
  id: WorkflowStageId;
  label: string;
  shortLabel: string;
  statusField: string;
}

const GENERIC_STAGE_KEYS: StageKey[] = [
  "impactanalysis",
  "mopcreate",
  "mopvalidate",
  "scheduling",
  "activityimplement",
  "closer",
];

/** Ordered 7-stage list driving the stage rail and sidebar stage labels. */
export const WORKFLOW_STAGES: WorkflowStageDescriptor[] = [
  {
    id: "review",
    label: "Plan & Inventory",
    shortLabel: "Plan & Inventory",
    statusField: "crqReviewStatus",
  },
  ...GENERIC_STAGE_KEYS.map((key) => {
    const cfg = getStageConfig(key);
    return {
      id: key,
      label: cfg.label,
      shortLabel: cfg.label,
      statusField: cfg.statusField,
    };
  }),
];

const COMPLETED_VALUES = new Set(["Done", "DONE", "Completed", "completed", "Complete"]);
const FAILED_VALUES = new Set(["Failed", "failed", "FAILED"]);
// Distinct from FAILED_VALUES so the UI can label a cancelled stage
// "Canceled" instead of "Failed" - same terminal/negative styling, different
// wording, since "canceled" (a deliberate stop) reads differently to users
// than "failed" (an error).
const CANCELED_VALUES = new Set([
  "canceled",
  "Canceled",
  "CANCELED",
  "cancelled",
  "Cancelled",
  "CANCELLED",
  "Cancel",
  "cancel",
]);
const IN_PROGRESS_VALUES = new Set(["In Progress", "in progress"]);

/** Backend CRQ_MASTER_TBL.current_stage enum -> WorkflowStageId. */
export const STAGE_ENUM_TO_ID: Record<string, WorkflowStageId> = {
  VALIDATE: "review",
  IMPACT_ANALYSIS: "impactanalysis",
  MOP_CREATION: "mopcreate",
  MOP_VALIDATION: "mopvalidate",
  SCHEDULING_APPROVAL: "scheduling",
  EXECUTION: "activityimplement",
  CLOSURE: "closer",
};

/** WorkflowStageId -> backend CRQ_MASTER_TBL.current_stage enum (reverse of STAGE_ENUM_TO_ID). */
export const STAGE_ID_TO_ENUM: Record<WorkflowStageId, string> = Object.fromEntries(
  Object.entries(STAGE_ENUM_TO_ID).map(([enumValue, id]) => [id, enumValue]),
) as Record<WorkflowStageId, string>;

function readStatus(
  crq: Crq | null | undefined,
  stage: WorkflowStageDescriptor,
): string | undefined {
  if (!crq) return undefined;
  const value = (crq as any)[stage.statusField];
  return typeof value === "string" && value.length ? value : undefined;
}

/** History entry for a given stage, when the backend supplied history[]. */
export function findHistoryEntry(crq: Crq | null | undefined, stageId: WorkflowStageId) {
  return crq?.history?.find((h) => h.stageKey === stageId) ?? null;
}

/**
 * Index of the CRQ's current stage. Prefers the authoritative
 * `crq.currentStage` (CRQ_MASTER_TBL) sent by the new workflow endpoints;
 * falls back to the legacy first-not-completed status-field scan for
 * responses that don't carry it.
 */
export function resolveCurrentStageIndex(crq: Crq | null | undefined): number {
  if (!crq) return 0;

  const stageId = crq.currentStage ? STAGE_ENUM_TO_ID[crq.currentStage] : undefined;
  if (stageId) {
    const idx = WORKFLOW_STAGES.findIndex((s) => s.id === stageId);
    if (idx >= 0) return idx;
  }

  for (let i = 0; i < WORKFLOW_STAGES.length; i++) {
    const status = readStatus(crq, WORKFLOW_STAGES[i]);
    if (!status || !COMPLETED_VALUES.has(status)) return i;
  }
  return WORKFLOW_STAGES.length - 1;
}

/**
 * Classifies a raw status display string (e.g. crq.crqStatus, or any
 * per-stage status field) into a StageRunState, using the same value sets
 * resolveStageState uses. Exported for callers that only have a status
 * string and no per-stage history[] to consult - e.g. the CRQ workflow
 * cockpit's paginated list rows, which omit history[] to keep list pages
 * cheap (see CrqWorkflowService.getWorkflowOverviewPaged).
 */
export function classifyStatusValue(status: string | null | undefined): StageRunState {
  if (status && COMPLETED_VALUES.has(status)) return "completed";
  if (status && CANCELED_VALUES.has(status)) return "canceled";
  if (status && FAILED_VALUES.has(status)) return "failed";
  if (status && IN_PROGRESS_VALUES.has(status)) return "in_progress";
  return "not_started";
}

/**
 * True when a status string means "cancelled" - in any of the spellings the
 * backend uses (raw CRQ_MASTER_TBL enum `CANCELLED`, the Get_CRQ_Stage_History
 * label `Canceled`, the legacy per-stage `canceled`). Callers that need to
 * freeze a cancelled stage's UI use this rather than their own literal list,
 * so a spelling the classifier already knows can't slip past one of them.
 */
export function isCanceledStatus(status: string | null | undefined): boolean {
  return classifyStatusValue(status) === "canceled";
}

/** Run-state of a single stage, given the CRQ's current stage index. */
export function resolveStageState(
  crq: Crq | null | undefined,
  stageIndex: number,
  currentIndex: number,
): StageRunState {
  const stage = WORKFLOW_STAGES[stageIndex];

  // History (when present) is authoritative: previous stages of the
  // current-stage pointer are completed by definition of the workflow.
  const entry = findHistoryEntry(crq, stage.id);
  const status = entry?.status ?? readStatus(crq, stage);

  if (status && COMPLETED_VALUES.has(status)) return "completed";
  if (status && CANCELED_VALUES.has(status)) return "canceled";
  if (status && FAILED_VALUES.has(status)) return "failed";
  if (stageIndex < currentIndex) return "completed";
  if (stageIndex > currentIndex) return "locked";
  if (status && IN_PROGRESS_VALUES.has(status)) return "in_progress";
  return "not_started";
}

export interface StageStatePalette {
  bg: string;
  fg: string;
  dot: string;
}

export interface StageStateColorSource {
  successDim: string;
  success: string;
  infoDim: string;
  info: string;
  accent: string;
  dangerDim: string;
  danger: string;
  trackOff: string;
  textDim: string;
  textSecondary: string;
  border: string;
}

/** Shared completed/in-progress/failed/locked/not-started palette + chip
 * label, used anywhere a StageRunState needs to render as a colored chip
 * (StageRail, the Attribute Update timeline cards, ...). */
export function stageStatePalette(
  state: StageRunState,
  colors: StageStateColorSource,
): StageStatePalette & { label: string } {
  switch (state) {
    case "completed":
      return { bg: colors.successDim, fg: colors.success, dot: colors.success, label: "Done" };
    case "in_progress":
      return { bg: colors.infoDim, fg: colors.info, dot: colors.accent, label: "Active" };
    case "failed":
      return { bg: colors.dangerDim, fg: colors.danger, dot: colors.danger, label: "Failed" };
    case "canceled":
      return { bg: colors.dangerDim, fg: colors.danger, dot: colors.danger, label: "Canceled" };
    case "locked":
      return { bg: colors.trackOff, fg: colors.textDim, dot: colors.border, label: "Locked" };
    default:
      return { bg: colors.trackOff, fg: colors.textSecondary, dot: colors.textDim, label: "Paused" };
  }
}

/**
 * CRQ_MASTER_TBL.current_status enum -> the same human labels
 * Get_CRQ_Stage_History's CASE already renders elsewhere in the cockpit
 * (2026-07-08_crq_stage_history_and_overview.sql). Endpoints that select
 * current_status directly (e.g. get_crq_validation_details) return the raw
 * enum instead of going through that CASE, so this keeps their display in
 * sync without a second database round-trip.
 */
const CURRENT_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "In Progress",
  ON_HOLD: "Paused",
  PENDING_APPROVAL: "Pending Approval",
  DONE: "Done",
  COMPLETE: "Done",
  FAILED: "Failed",
  CANCELLED: "Canceled",
  RESCHEDULED: "Rescheduled",
};

export interface CrqStatusColorSource {
  success: string;
  successDim: string;
  successBorder: string;
  danger: string;
  dangerDim: string;
  dangerBorder: string;
  warning: string;
  warningDim: string;
  warningBorder: string;
  info: string;
  infoDim: string;
  infoBorder: string;
  textSecondary: string;
  trackOff: string;
  border: string;
}

export interface CrqStatusPalette {
  label: string;
  fg: string;
  bg: string;
  border: string;
}

/** Raw current_status enum -> {label, fg, bg, border}, for rendering as a
 * colored chip anywhere the value comes straight off CRQ_MASTER_TBL. */
export function crqStatusPalette(
  status: string | null | undefined,
  colors: CrqStatusColorSource,
): CrqStatusPalette {
  const key = (status ?? "").toUpperCase();
  const label = CURRENT_STATUS_LABELS[key] ?? (status || "Not Started");

  switch (key) {
    case "DONE":
    case "COMPLETE":
      return { label, fg: colors.success, bg: colors.successDim, border: colors.successBorder };
    case "FAILED":
    case "CANCELLED":
      return { label, fg: colors.danger, bg: colors.dangerDim, border: colors.dangerBorder };
    case "ON_HOLD":
    case "PENDING_APPROVAL":
      return { label, fg: colors.warning, bg: colors.warningDim, border: colors.warningBorder };
    case "IN_PROGRESS":
    case "RESCHEDULED":
      return { label, fg: colors.info, bg: colors.infoDim, border: colors.infoBorder };
    default:
      return { label, fg: colors.textSecondary, bg: colors.trackOff, border: colors.border };
  }
}

export interface StageSummaryField {
  /** Raw API field name (e.g. "olmidReview") - used for presentational grouping only. */
  key: string;
  label: string;
  value: string;
}

export type SummarySectionId =
  | "general"
  | "workflow"
  | "scheduling"
  | "engineer"
  | "activity"
  | "remarks";

export interface SummarySectionDef {
  id: SummarySectionId;
  label: string;
  /** MUI icon name from @mui/icons-material, resolved by the consuming component. */
  icon: string;
}

/** Display order for the categorized field sections in the CRQ summary body. */
export const SECTION_DEFS: SummarySectionDef[] = [
  { id: "general", label: "General Information", icon: "InfoOutlined" },
  { id: "workflow", label: "Workflow Details", icon: "AccountTreeRounded" },
  { id: "scheduling", label: "Scheduling Details", icon: "EventRounded" },
  { id: "engineer", label: "Engineer Details", icon: "EngineeringRounded" },
  { id: "activity", label: "Activity Details", icon: "BoltRounded" },
  { id: "remarks", label: "Remarks / Comments", icon: "ChatBubbleOutlineRounded" },
];

/**
 * Buckets a raw CRQ field key into one of SECTION_DEFS for presentational
 * grouping only - doesn't change which fields are shown or their values,
 * just how getStageSummaryFields' flat list is organized into cards.
 * Ordered keyword match (first match wins); anything unmatched falls back
 * to "general".
 */
export function categorizeStageField(key: string): SummarySectionId {
  const k = key.toLowerCase();

  if (k.includes("remark") || k.includes("comment")) return "remarks";

  if (
    k.includes("olm") ||
    k.includes("assign") ||
    k.includes("performedby") ||
    k.includes("engineer") ||
    k.includes("vendor") ||
    k.includes("firstname") ||
    k.includes("lastname") ||
    k.includes("company")
  )
    return "engineer";

  if (k.includes("date") && (k.includes("plan") || k.includes("schedule") || k.includes("requested") || k.includes("impact")))
    return "scheduling";

  if (
    k.includes("task") ||
    k.includes("activity") ||
    k.includes("sequence") ||
    k.includes("location") ||
    k.includes("territory") ||
    k.includes("nodetype") ||
    k.includes("nelabel") ||
    k.includes("profiletype")
  )
    return "activity";

  if (
    k.includes("status") ||
    k.includes("stage") ||
    k.includes("state") ||
    k.includes("workflow")
  )
    return "workflow";

  return "general";
}

/** Fields rendered elsewhere (sidebar/header) or structural - never shown
 * again in the generic per-stage field grid. */
const SUMMARY_EXCLUDED_KEYS = new Set(["tasks", "history", "actionable", "crqId"]);

/** Short tokens that should render as an acronym instead of Title-Case. */
const ACRONYM_WORDS = new Set([
  "id",
  "crq",
  "olm",
  "olmid",
  "ne",
  "m6",
  "isis",
  "cab",
]);

/**
 * Turns an API field name into a human label without any per-stage mapping,
 * e.g. "reviewStartDate" -> "Review Start Date", "olmidReview" -> "OLMID
 * Review", "neLabel" -> "NE Label". Works the same regardless of which of
 * the 7 stages' differently-named fields it's given.
 */
/** Overrides applied to the auto-generated label itself (not the raw key,
 * which varies per stage endpoint and isn't statically known) - e.g. the
 * generic "Plan Window" reads better as "Execution Window". */
const LABEL_OVERRIDES: Record<string, string> = {
  "Plan Window": "Execution Window",
};

function humanizeKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_]+/)
    .filter(Boolean);
  const label = words
    .map((w) => {
      const lower = w.toLowerCase();
      if (ACRONYM_WORDS.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
  return LABEL_OVERRIDES[label] ?? label;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?/;

/** Formats a raw field value for display - ISO-looking dates (detected by
 * value shape or a "date" in the key name) go through the same date-fns
 * formatter the rest of the app uses; everything else renders as-is. */
function formatFieldValue(key: string, value: unknown): string {
  if (typeof value === "string" && (ISO_DATE_RE.test(value) || /date/i.test(key))) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return format(d, "dd-MMM-yyyy HH:mm");
  }
  return String(value);
}

/**
 * Real-field-only summary shown in each stage's detail body: every scalar
 * property the API actually returned on the selected CRQ for the current
 * stage, auto-labeled and auto-formatted. No invented content (checklists,
 * node tables, step lists, impact metrics, etc), and no per-stage field-name
 * mapping - each of the 7 stages' endpoints can use whatever field names
 * they want (e.g. "reviewStartDate" vs "impactStartDate") and this renders
 * whatever comes back as-is.
 */
export function getStageSummaryFields(
  _stageId: WorkflowStageId,
  crq: Crq | null | undefined,
): StageSummaryField[] {
  if (!crq) return [];
  const c = crq as Record<string, unknown>;

  return Object.keys(c)
    .filter((key) => {
      if (SUMMARY_EXCLUDED_KEYS.has(key)) return false;
      const value = c[key];
      if (value === null || value === undefined) return false;
      if (typeof value === "object") return false;
      if (typeof value === "string" && !value.trim().length) return false;
      return true;
    })
    .map((key) => ({
      key,
      label: humanizeKey(key),
      value: formatFieldValue(key, c[key]),
    }));
}
