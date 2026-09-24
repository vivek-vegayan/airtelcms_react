/**
 * One workflow stage of a CRQ as returned by the backend (crq.history[]).
 * Past stages are immutable audit records (readOnly: true, no actions);
 * exactly one entry carries current: true - the CRQ's live stage.
 */
export interface StageHistoryEntry {
  /** Backend stage enum: VALIDATE | IMPACT_ANALYSIS | MOP_CREATION | ... */
  stage: string;
  /** Frontend stage key: review | impactanalysis | mopcreate | ... */
  stageKey: string | null;
  /** Human label: "Plan & Inventory", "Impact Analysis", ... */
  stageLabel: string | null;
  /** Final (past stage) or live (current stage) status display value. */
  status: string | null;
  assignedTo?: string | null;
  performedBy?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  current: boolean;
  readOnly: boolean;
}

export interface Task {
  taskId: string;
  neLabel: string;
  planActivityDetails: string;
  activitySequence: string;
  taskProfileType: string;
  locationCodeM6: string;
  workAreaTerritory: string;
  /** Execution window (CRQ_MASTER_TBL.execution_slot_start/end). */
  executionSlotStart: string;
  executionSlotEnd: string;
  /** @deprecated legacy alias of executionSlotStart/End - same value. */
  activityPlanStartDate?: string;
  activityPlanEndDate?: string;
  taskActivity: string;
}

export interface Crq {
  crqNo: string;
  crqRaisedDate: string;
  description: string;
  crqStatus: string;
  crqId: number;
  remark?: string | null;
  managerChange?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  ascpy?: string | null;
  asorg?: string | null;
  asgrp?: string | null;
  supportOrganization?: string | null;
  supportGroupName?: string | null;
  categorizationTier_1?: string | null;
  categorizationTier_2?: string | null;
  categorizationTier_3?: string | null;
  requestedStartDate?: string | null;
  requestedEndDate?: string | null;
  detailedDescription?: string | null;
  aschg?: string | null;
  remedyChangeImpact?: string | null;
  /** change_impact of the CRQ (falls back to remedyChangeImpact server-side). */
  changeImpact?: string | null;
  /** Ops deploy task of the CRQ (BaseCrqDto.opsDeployTask). */
  opsDeployTask?: string | null;
  neLabel?: string | null;
  planType?: string | null;
  planNumber?: string | null;
  taskId?: string | null;
  planActivityDetails?: string | null;
  activitySequence?: string | null;
  locationCodeM6?: string | null;
  taskProfileType?: string | null;
  state?: string | null;
  assignedGroup?: string | null;
  assignedDepartment?: string | null;
  nodeType?: string | null;
  vendor?: string | null;
  /**
   * Execution window of the CRQ (CRQ_MASTER_TBL.execution_slot_start/end) as
   * returned by the Get_CRQ_Workflow_Overview* procedures. Reschedule-aware:
   * this is the slot the CRQ will actually run in.
   */
  executionSlotStart?: string | null;
  executionSlotEnd?: string | null;
  /** @deprecated legacy alias of executionSlotStart/End - same value. */
  activityPlanStartDate?: string | null;
  activityPlanEndDate?: string | null;
  impactStartDate?: string | null;
  impactEndDate?: string | null;
  impactAnalysisStatus?: string | null;
  olmidImpactAnalysis?: string | null;
  
  // Backwards compatibility / fallbacks for previous UI logic
  crqReviewStatus?: string | null;
  olmidReview?: string | null;
  reviewStartDate?: string | null;
  reviewEndDate?: string | null;
  workflow?: string | null;

  /** Backend stage enum of the CRQ's live stage (CRQ_MASTER_TBL.current_stage). */
  currentStage?: string | null;
  /** Whether this record is the CRQ's current actionable stage record. */
  actionable?: boolean | null;
  /** Complete per-stage history in workflow order (previous stages read-only). */
  history?: StageHistoryEntry[] | null;

  tasks: Task[];

  // Every other stage's endpoint (mopcreate/mopvalidate/scheduling/
  // activityimplement/closer) returns its own differently-named status/date/
  // olmId fields on top of this same shape - deliberately left open-ended
  // (rather than enumerated) since the dynamic stage summary grid
  // (constants/workflowStages.ts) reads whatever the API actually returns.
  [extraField: string]: unknown;
}

export interface Plan {
  planNumber: string;
  planType: string;
  description: string;
  crqs: Crq[];
}

export interface CrqReviewResponse {
  plans: Plan[];
}