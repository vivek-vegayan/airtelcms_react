// ─────────────────────────────────────────────────────────────────────────────
//  CAB Portal — shared types
//  Mirrors the data shapes used by the Claude Design CAB Portal mock-up.
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums / unions ──────────────────────────────────────────────────────────
export type CrqStage =
  | "VALIDATE"
  | "IMPACT_ANALYSIS"
  | "MOP_CREATION"
  | "MOP_VALIDATION"
  | "SCHEDULING_APPROVAL"
  | "EXECUTION"
  | "CLOSURE";

export type CrqStatus = "pending" | "approved" | "rejected" | "delegated";

export type ImpactCode = "SA" | "NSA";

export type Domain = "IP Core" | "Optics" | "Packet" | "Embedded" | "Mobility";

export type Circle =
  | "MH" | "KA" | "GJ" | "DL" | "TN" | "AP" | "WB" | "UP-E" | "RJ" | "MP";

export type Role =
  | "admin"
  | "requester"
  | "stakeholder"
  | "cabEngineer"
  | "cabMember"
  | "se";

export type CabSessionStatus = "live" | "scheduled" | "completed";

// ── CRQ ─────────────────────────────────────────────────────────────────────
export interface Crq {
  serviceApprovalId:number;
  crqNo: string;
  planId: string;
  domainName: Domain;
  circleCode: Circle;
  currentStage: CrqStage;
  serviceCode: string;
  stageStatus: string;
  serviceApprovalStatus: string;
  /**
   * Change_Impact from sp_get_cab_crqs — SA (service affecting) / NSA.
   * Optional because only the All CRQs proc selects it; the My CRQs rows proc
   * shares this DTO without returning the column.
   */
  changeImpact?: ImpactCode;
  slaPercentage: number;
  // Not returned by the current AllCRQs/MyCRQs list & detail endpoints —
  // kept optional for the mock-only Journey/Implementation pages.
  approverName?: string;
  assignStartTime?: string;
  assignedToMe?: boolean;
  raisedBy?: string;
}

/**
 * Row detail behind GET /cab/crqs/mine/{serviceApprovalId} (sp_get_cab_my_crq_by_id).
 *
 * A strict subset of `Crq`: the proc keys off Service_Approval_Id and no longer
 * returns the approver / impact / service-approval-status columns, so anything
 * the drawer needs beyond this comes from the My CRQs list row it was opened
 * from (`serviceApprovalStatus` in particular).
 */
export interface MyCrqDetail {
  serviceApprovalId: number;
  crqNo: string;
  planId: string;
  domainName: Domain;
  circleCode: Circle;
  currentStage: CrqStage;
  serviceCode: string;
  stageStatus: string;
  slaPercentage: number;
}

// ── CAB services (AllCRQs "Service" filter) ─────────────────────────────────
export interface CabService {
  serviceCode: string;
}

/**
 * One row of GET /cab/admin/circledropdown, normalised to the single code the
 * dropdown renders and submits. The backend column is read tolerantly in the
 * API slice (circleCode / circleName / circle / name, or a bare string), so a
 * rename on the proc side degrades to "no match" for that row rather than a
 * silently blank list.
 */
export interface CircleDropdown {
  circleCode: string;
}

// ── Filters used by All CRQs ─────────────────────────────────────────────────
export interface CrqFilters {
  stage?: CrqStage | "All Stages";
  domain?: Domain | "All Domains";
  circle?: Circle | "All Circles";
  impact?: ImpactCode | "All Impact";
  serviceCode?: string;
  search?: string;
}

// ── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardKpi {
  label: string;
  value: number | string;
  foot: string;
  /** Optional accent token for the icon tile. */
  accent?: "blue" | "green" | "orange" | "red" | "purple";
}

export interface StageBar {
  stage: CrqStage;
  count: number;
  /** 0-100 share of total. */
  pct: number;
}

export interface EscalationItem {
  crqNo: string;
  slaPercentage: number;
}

export interface DashboardData {
  kpis: DashboardKpi[];
  stageBars: StageBar[];
  escalations: EscalationItem[];
}

// ── My CRQs ─────────────────────────────────────────────────────────────────
export interface MyCrqsStats {
  awaitingMe: number;
  approvedThisWeek: number;
  rejectedThisWeek: number;
}

export interface MyCrqsResponse {
  stats: MyCrqsStats;
  rows: Crq[];
}

// ── CRQ Journey ─────────────────────────────────────────────────────────────
export interface ApprovalChainStep {
  level: string;     // "L1"…"L5"
  label: string;     // stage name
  who: string;
  state: "completed" | "in_progress" | "pending" | "rejected" | "not_started";
}

export interface ParallelTrack {
  track: string;
  approver: string;
  role: string;
  status: "approved" | "reviewing" | "pending" | "queued" | "rejected";
  color: string;
  time: string;
}

export interface JourneyRemark {
  who: string;
  role: string;
  stage: CrqStage | string;
  comment: string;
  time: string;
}

export interface CrqJourney {
  crq: Crq;
  pipeIndex: number;              // 0-6
  approvalChain: ApprovalChainStep[];
  parallelTracks: ParallelTrack[];
  remarks: JourneyRemark[];
}

// ── CAB Planning ────────────────────────────────────────────────────────────
export interface CabQueueRow {
  crqNo: string;
  impact: ImpactCode;
  circle: string;
  domain: Domain;
  executionWindow: string;
}

export interface CabQueueParams {
  domainId: number;
  subDomainId: number;
}

export interface CabPlanDate {
  date: string;        // "2026-06-14"
  dayName: string;     // "FRI"
  dayNum: string;      // "14"
  monthName: string;   // "JUN"
  sessionId: string;   // CAB-… reference
  type: "Critical" | "Normal" | "Emergency";
  crqIds: string[];
}

// ── CAB Sessions ────────────────────────────────────────────────────────────
export interface CabSession {
  id: string;
  /**
   * The meeting link this session runs on. Null/absent for a session planned
   * before the bridge was booked, and not necessarily a well-formed URL — the
   * column is free text, so run it through `toSessionUrl` before linking to it.
   */
  sessionLink?: string | null;
  stage: CrqStage;
  host: string;
  date: string;
  time: string;
  status: CabSessionStatus;
  type: "Critical" | "Normal" | "Emergency";
  crqIds: string[];
}

// ── CAB Session agenda board (sp_get_crq_cab_agenda_v2) ─────────────────────

/** Decision standing against a CRQ on a session's agenda. */
export type CabDecision = "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED";

/**
 * One line of the agenda board.
 *
 * `mappingId` — not the CRQ number — is what a decision is recorded against:
 * the same CRQ can be tabled again at a later session, and each sitting keeps
 * its own decision. circle / nodeName / changeImpact are nullable because a CRQ
 * can reach the CAB before its circle or node inventory is filled in.
 */
export interface CabAgendaRow {
  mappingId: number;
  circle: string | null;
  crqNo: string;
  nodeName: string | null;
  changeImpact: ImpactCode | null;
  cabDecision: CabDecision | string;
  cabSessionDate: string;
  chairedBy: string;
}

/** What sp_cab_session_crq_action accepts. */
export type CabSessionCrqAction = "APPROVE" | "REJECT" | "RESCHEDULE";

export interface CabSessionCrqActionPayload {
  /** Carried only so the agenda cache for this session can be invalidated. */
  sessionId: string;
  mappingId: number;
  action: CabSessionCrqAction;
  /** Free-text ground for the decision. Required for REJECT and RESCHEDULE. */
  reason?: string;
  comment?: string;
}

export interface CabSessionCrqActionResult {
  mappingId: number;
  cabId: string;
  crqNo: string;
  previousStatus: string;
  newStatus: string;
}

export interface AddCrqToSessionPayload {
  sessionId: string;
  crqIds: string[];
}

/** A CRQ the session already carries comes back skipped, not as a failure. */
export interface AddCrqToSessionResult {
  cabId: string;
  addedCount: number;
  skippedCount: number;
  addedCrqList: string[];
  skippedCrqList: string[];
}

// ── Implementation (Field SE) ───────────────────────────────────────────────
export interface SeRing {
  id: string;
  ring: string;
  locA: string;
  locB: string;
  type: string;
  slotStart: string;
  slotEnd: string;
  decision: "pending" | "proceed" | "block";
}

export interface ImplementationDetail {
  crq: Crq;
  noc: { tollFree: string; email: string; called: boolean };
  rings: SeRing[];
}

export interface ProceedRingPayload  { crqId: string; ringId: string; }
export interface BlockRingPayload    { crqId: string; ringId: string; comment?: string; }

// ── Admin ───────────────────────────────────────────────────────────────────
export interface AdminAnalytics {
  total: number;
  approved: number;
  rejected: number;
  breachRisk: number;
  heat: { domain: Domain; breach: number; total: number; level: "low" | "mid" | "high" }[];
}

export interface AssignMatrixCell {
  stage: CrqStage;
  domain: Domain;
  approver: string;
}

export interface AssignRule {
  id: string;
  domain: Domain;
  circle: Circle;
  impact: ImpactCode;
  stage: CrqStage;
  approver: string;
  active: boolean;
}

export interface ServiceApprovalRule {
  id: string;
  service: string;
  circle: string;
  l1: string;
  l2: string;
  l3: string;
  active: boolean;
}

/** Mirrors backend common/dto/PageResponseDto.java */
export interface CabPageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Spring Pageable query params — pageNumber is 0-based, matching MRT's pageIndex. */
export interface CabPageParams {
  page?: number;
  size?: number;
}

export interface RejectionReason {
  reason: string;
  active: boolean;
}

export interface EscalationRow {
  stage: CrqStage;
  l1: string;
  l2: string;
  l3: string;
  notify: string;
}

export interface AdminUser {
  name: string;
  olm: string;
  role: string;
  domain: string;
  access: "Approve" | "Write" | "Read";
  status: "active" | "inactive";
}

export interface AuditEntry {
  actor: string;
  action: string;
  crq: string;
  stage: CrqStage | string;
  time: string;
  tag: "create" | "system" | "approve" | "reject" | "delegate" | "escalate";
}

// ── Mutation payloads ───────────────────────────────────────────────────────
/**
 * POST /cab/sessions. `conflict` echoes what GET /cab/sessions/conflict said
 * about this slot: true means the CRQs join the session already booked there
 * (on its `sessionLink`) instead of opening a second one.
 */
export interface PlanCabPayload {
  crqIds: string[];
  sessionDateTime: string;
  type: CabSession["type"];
  sessionLink?: string;
  conflict: boolean;
  /** Who to notify about the session; reaches sp_plan_cab_session as p_email_list. */
  emailList?: string[];
}

/** GET /cab/sessions/conflict - what, if anything, is already booked in a slot. */
export interface CabPlanConflict {
  conflict: boolean;
  cabId: string | null;
  sessionLink: string | null;
  /** CRQs the existing session already carries; empty when the slot is free. */
  crqList: string[];
}
export interface PlanCabResult       { status: string; message: string; }
export interface NewCrqPayload {
  activity: string;
  domain: Domain;
  circle: Circle;
  impact: ImpactCode;
  technology: string;
  scheduled: string;
  window: string;
  hostname: string;
  impactedParties: string[];
}

export interface AssignSpocPayload { crqId: string; spocOlmId: string; }
export interface AssignFePayload   { crqId: string; fieldEngineerOlmId: string; }
/**
 * SPOC assignment goes to sp_approve_cab_crq's p_spoc_name / p_spoc_mob_no /
 * p_spoc_email. All three are mandatory - approving assigns the SPOC who owns
 * the change - and the endpoint answers 409 if any is blank.
 */
export interface ApproveCrqPayload {
  serviceApprovalId: number;
  comment?: string;
  spocName: string;
  spocMobNo: string;
  spocEmail: string;
}
export interface RejectCrqPayload  { serviceApprovalId: number; reasonId: number; comment: string; }
export interface ReschedulePayload { serviceApprovalId: number; newDate: string; newWindow: string; reason: string; }

export interface AddServiceRulePayload {
  id?: number;
  service: string;
  circle: string;
  l1: string;
  l2: string;
  l3: string;
  active: boolean;
}

// ── Workflow action result (approve / reject / reschedule) ─────────────────
export interface CrqActionResult { status: string; message: string; }

// ── Conflict check (AllCRQs / MyCRQs "Conflict" action) ─────────────────────
export interface CrqConflictDetail {
  executionDate: string;
  neLabel: string;
  conflictingCrqNo: string;
  currentStage: string;
  currentStatus: string;
  taskId: string;
  planActivityDetails: string;
  activityPlanStartDate: string;
  activityPlanEndDate: string;
}

export type CrqConflictFlag = "YES" | "NO";

/**
 * GET /cab/crqs/{crqNo}/spoc-fe-details — one row of sp_get_SPOC_FE_details.
 *
 * Every column except Crq_No is nullable in the proc: a CRQ can have a SPOC
 * with no FE yet (or neither), and even an assigned person may have no email
 * on record. The UI must treat each field as independently missing rather than
 * assuming "SPOC exists" implies the whole SPOC block is populated.
 */
export interface SpocFeDetails {
  crqNo: string;
  spocOlmId: string | null;
  spocName: string | null;
  spocNumber: string | null;
  spocEmail: string | null;
  feOlmId: string | null;
  feName: string | null;
  feNumber: string | null;
  feEmail: string | null;
}
export interface CrqConflictDecisionPayload { crqNo: string; flag: CrqConflictFlag; }

// ── Reject reasons (AllCRQs reject dropdown) ────────────────────────────────
export interface CabRejectReason { reasonId: number; reasonText: string; }

// ── Persona (role switcher) ─────────────────────────────────────────────────
export interface Persona {
  role: Role;
  name: string;
  title: string;
  shortTitle: string;
  olm: string;
  initials: string;
  color: string;
  home: string;
}
