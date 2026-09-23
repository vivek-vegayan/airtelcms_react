import type { SvgIconComponent } from "@mui/icons-material";

/**
 * Every workflow stage maps 1:1 to the backend endpoint group, e.g.
 *   "mopcreate"        -> /crqworkflow/updatemopcreate/{start|pause}
 *                          /crqworkflow/mopcreate (GET)
 *   "impactanalysis"   -> /crqworkflow/updateimpactanalysis/{start|pause|done}
 *                          /crqworkflow/impactanalysis (GET)
 *
 * Adding a new stage = adding a new key here + one config entry in
 * `constants/stageConfig.ts`. No new components/hooks/services required.
 */
export type StageKey =
  | "impactanalysis"
  | "mopcreate"
  | "mopvalidate"
  | "scheduling"
  | "activityimplement"
  | "closer";

export type StageStatusValue = "Done" | "Failed" | "canceled";

export interface StageActionParams {
  crqNo: string;
  crqId: string | number;
}

/**
 * Generic "done" payload. Every stage's /done endpoint accepts a different
 * subset of fields (olmId, planNumber, taskNumber, etc) - hence the index
 * signature. `doneFieldMap` on StageConfig is responsible for shaping this
 * from the form values + selected CRQ.
 */
export interface StageDonePayload extends StageActionParams {
  localStatus?: string;
  remark?: string;
  [key: string]: any;
}

/**
 * Machine codes returned by a refused stage outcome
 * (`StageActionErrorResponse.code`, HTTP 409/404/400). The stored procedure
 * validates the transition itself and rolls back when a precondition fails;
 * the backend translates its `error_message` into one of these so the UI can
 * pick copy and a follow-up action without parsing the DB's wording.
 *
 * Today only Scheduling emits the CAB/Ops codes - they are the guards inside
 * `Update_CRQ_Scheduling_To_Done_Or_Failed` - but the shape is stage-agnostic
 * and every stage passes through the same alert.
 */
export type StageActionErrorCode =
  /** No CRQ_MASTER_TBL row for that crqNo any more. */
  | "CRQ_NOT_FOUND"
  /** The CRQ has already left this stage - someone else actioned it. */
  | "STAGE_MISMATCH"
  /** Pass only: the Deployment & Operation task has not been closed. */
  | "OPS_DEPLOY_TASK_OPEN"
  /** Pass only: CAB has not decided yet. */
  | "CAB_APPROVAL_PENDING"
  /** Pass only: CAB rejected the request, so it can never advance. */
  | "CAB_APPROVAL_REJECTED"
  /** The outcome sent is not one this stage's procedure acts on. */
  | "INVALID_OUTCOME"
  /** Refused for a reason the backend did not recognise - `message` is the DB's own. */
  | "STAGE_ACTION_FAILED";

export interface StageActionError {
  code: StageActionErrorCode;
  /** What went wrong, already written for the user. */
  message: string;
  /** What to do about it, one sentence. */
  hint?: string;
  stage?: string;
  crqNo?: string;
}

/**
 * Result of a /done submission. `error` is present only for a refusal the
 * backend could describe - a network/500 failure toasts and comes back with
 * `success: false` alone.
 */
export interface StageSubmitResult {
  success: boolean;
  error?: StageActionError;
}

export interface StageFieldOption {
  label: string;
  value: string;
}

/**
 * Lookups a field can be fed from the server instead of `options`, resolved
 * by FieldRenderer. Only one today: the cancellation reason list from
 * sp_Get_Distinct_Cancellation_Reasons.
 */
export type StageFieldOptionsSource = "cancellationReasons";

/**
 * Server-loaded data a field's `deriveValueWith` can read - the config stays
 * declarative while the values themselves come from the API.
 */
export interface StageFieldDeriveContext {
  /** Reason -> rollback owner, from useCancellationReasons(). */
  ownerForCancellationReason: (reason?: string | null) => string;
}

/**
 * A single config-driven form field. The generic FormPanel renders fields
 * purely off this config - no per-stage JSX duplication.
 */
export interface StageFieldConfig {
  name: string;
  label: string;
  type: "select" | "text" | "textarea" | "readonly";
  required?: boolean;
  placeholder?: string;
  options?: StageFieldOption[];
  /** Fetch this select's options from the server rather than listing them
   * here. Takes precedence over `options`. */
  optionsSource?: StageFieldOptionsSource;
  /** Show this field only when predicate against current form values is true */
  visibleWhen?: (values: Record<string, any>) => boolean;
  /** Mark required dynamically (e.g. only when status === "canceled") */
  requiredWhen?: (values: Record<string, any>) => boolean;
  /** Derive a read-only value from other form values (e.g. rollback owner) */
  deriveValue?: (values: Record<string, any>) => string;
  /** Same, but for values that need server-loaded data - the rollback owner
   * of the picked cancellation reason. Takes precedence over `deriveValue`. */
  deriveValueWith?: (
    values: Record<string, any>,
    ctx: StageFieldDeriveContext,
  ) => string;
}

export interface StageStatusOption {
  value: StageStatusValue;
  label: string;
  description: string;
  icon: SvgIconComponent;
  palette: "success" | "error" | "warning";
}

/**
 * The single source of truth for one workflow stage. Every reusable
 * component (table page, detail panel, card, dialog, form) takes a
 * StageConfig and renders itself accordingly.
 */
export interface StageConfig {
  key: StageKey;
  /** Human readable label, used in headers/toasts */
  label: string;
  /** e.g. "updatemopcreate" -> used to build /start /pause /done URLs */
  endpointBase: string;
  /** e.g. "/crqworkflow/mopcreate" -> GET listing endpoint */
  reviewQueryUrl: string;
  /** Backend stage enum (CRQ_MASTER_TBL.current_stage), e.g. "MOP_CREATION" */
  stageEnum: string;
  /** CRQ field holding this stage's assigned OLM id, e.g. "olmidExecution" */
  olmIdField: string;
  /** Field on the CRQ object that represents this stage's running status */
  statusField: string;
  /**
   * CRQ field holding this stage's actual start timestamp
   * (CRQ_STAGE_ASSIGN_TBL.actual_start_time, via the stage's Get_*_Details
   * proc), e.g. "executionStartDate". Each stage's proc aliases this
   * differently - see CrqWorkflowService/the schedular DTOs - so it must be
   * named explicitly per stage rather than derived from statusField/olmIdField.
   */
  startDateField: string;
  /** CRQ field holding this stage's actual end timestamp, e.g. "executionEndDate" */
  endDateField: string;
  /** Outcome options shown in the review/validate dialog */
  statusOptions: StageStatusOption[];
  /** Config-driven extra fields (cancellation block, remarks, etc) */
  fields: StageFieldConfig[];
  /** Shapes the final payload sent to the /done endpoint */
  buildDonePayload: (
    formValues: Record<string, any>,
    crq: any,
    context?: { currentUserOlmId?: string | null },
  ) => Record<string, any>;
}

export interface CrqReviewResponse {
  plans: any[];
}
