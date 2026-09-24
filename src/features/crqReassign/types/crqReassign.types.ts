// Row shapes are the procedures' own column labels (snake_case) — the backend
// hands the result sets through untouched, so these mirror 23_REASSIGN_READ.

export type ReassignStage =
  | "VALIDATE"
  | "IMPACT_ANALYSIS"
  | "MOP_CREATION"
  | "MOP_VALIDATION"
  | "SCHEDULING_APPROVAL"
  | "EXECUTION"
  | "CLOSURE";

export type CabFlag = "PENDING" | "APPROVED" | "REJECTED";

/** CRQ_SP_REASSIGN_GRID — one row per CRQ, one column per stage owner. */
export interface ReassignGridRow {
  crq_no: string;
  current_stage: string | null;
  current_status: string | null;
  cab_approval_flag: CabFlag | null;
  team_name: string | null;
  team_id: number | null;
  execution_slot_start: string | null;
  execution_slot_end: string | null;
  filled_stages: number;
  total_stages: number;
  validate_owner: string | null;
  impact_owner: string | null;
  mop_create_owner: string | null;
  mop_validate_owner: string | null;
  scheduling_owner: string | null;
  execution_owner: string | null;
  closure_owner: string | null;
  open_batch_id: string | null;
  total_rows: number;
}

export interface ReassignGridParams {
  search?: string;
  teamId?: number;
  cab?: string;
  onlyGaps: boolean;
  /** 1-based, as the proc expects. */
  page: number;
  size: number;
}

/** CRQ_SP_REASSIGN_TIMELINE — engineer × shift day, with the activity placed on it (if any). */
export interface ReassignTimelineRow {
  olmid: string;
  employee_name: string;
  job_level: string | null;
  team_name: string | null;
  shift_date: string;
  shift_name: string;
  activity_start: string | null;
  activity_end: string | null;
  work_date: string | null;
  window_min: number | null;
  free_min: number | null;
  Schedule_ID: number | null;
  crq_no: string | null;
  Plan_Id: string | null;
  Task_Id: string | null;
  Reserved_Minutes: number | null;
  Reservation_State: string | null;
  block_start: string | null;
  block_end: string | null;
  spans_next_day: number | null;
  continued_from_prev: number | null;
  assign_status: string | null;
  batch_id: string | null;
}

export interface ReassignTimelineParams {
  from: string;
  to: string;
  teamId?: number;
  level?: string;
  shift?: string;
  search?: string;
}

/** CRQ_SP_REASSIGN_CANDIDATES — who can take the stage, and why not. */
export interface ReassignCandidateRow {
  olmid: string;
  employee_name: string;
  job_level: string | null;
  device_vendor_capability: string | null;
  team_name: string | null;
  team_id: number | null;
  match_status: string;
  shift_date: string | null;
  shift_name: string | null;
  free_min: number;
  activities_today: number;
  required_min: number | null;
  busy_with: string | null;
  ineligible_reason: string | null;
  is_eligible: number;
}

export interface ReassignCandidateParams {
  crqNo: string;
  stage: ReassignStage;
  level?: string;
  sameTeam: boolean;
}

/** CRQ_SP_REASSIGN_STATS — header numbers. */
export interface ReassignStats {
  crq_in_queue?: number;
  unassigned_stages?: number;
  cab_pending?: number;
  crq_spanning_2_dates?: number;
  pending_publish?: number;
}

export interface ReassignStatsParams {
  from?: string;
  to?: string;
  batchId?: string;
}

/** CRQ_SP_REASSIGN_HISTORY — audit trail. */
export interface ReassignHistoryRow {
  log_id: number;
  batch_id: string;
  txn_seq: number;
  txn_type: string;
  crq_no: string;
  stage: string | null;
  stage_name: string | null;
  old_olmid: string | null;
  old_owner: string | null;
  new_olmid: string | null;
  new_owner: string | null;
  old_start: string | null;
  old_end: string | null;
  new_start: string | null;
  new_end: string | null;
  old_cab_flag: string | null;
  new_cab_flag: string | null;
  minutes_moved: number | null;
  is_reverted: number;
  is_published: number;
  remarks: string | null;
  payload: string | null;
  txn_by: string;
  txn_on: string;
}

export interface ReassignHistoryParams {
  crqNo?: string;
  batchId?: string;
  fromTs?: string;
  toTs?: string;
}

/* ── actions (22_REASSIGN_ACTIONS) ─────────────────────────────────────── */

export interface ReassignMemberRequest {
  crqNo: string;
  stage: ReassignStage;
  /** null = unassign */
  newOlmId: string | null;
  batchId: string | null;
  remarks?: string;
}

export interface ReassignTimeRequest {
  crqNo: string;
  stage: ReassignStage;
  /** "YYYY-MM-DD HH:mm:ss" */
  newStart: string;
  keepDuration: boolean;
  newEnd?: string | null;
  batchId: string | null;
}

export interface ReassignCabRequest {
  crqNo?: string | null;
  teamId?: number | null;
  cabFlag: CabFlag;
  batchId: string | null;
}

export interface ReassignBatchRequest {
  batchId: string | null;
}

export interface ReassignActionResponse {
  status: string;
  batchId: string | null;
  message: string;
}
