// ─── Step / approval status enums (drive card colors, not raw backend text) ──

export type StepStatus = "completed" | "in_progress" | "pending" | "not_started" | "cancelled";

export type ApprovalStatus = "approved" | "pending" | "rejected";

export type ApprovalIconKey =
  | "mobility"
  | "b2b"
  | "telemedia"
  | "optical"
  | "packet"
  | "security"
  | "ran"
  | "transmission"
  | "core"
  | "user"
  | "others";

// ─── Raw API row shapes (mirror backend DTOs exactly) ────────────────────────

/** One row from GetCRQBySubDomainId — backs the CRQ search/autocomplete. */
export interface CrqJourneySearchRow {
  crqNo: string;
  currentStage: string;
  currentStatus: string;
  enteredCurrentStageAt: string | null;
}

/** One row from result set 1 of sp_get_crq_journey_page — dynamic-length CRQ journey. */
export interface CrqJourneyStageRow {
  stage: string;
  status: string;
}

/** The three rungs of a CAB service's approval ladder, in escalation order. */
export type ApproverLevelKey = "L1" | "L2" | "L3";

/**
 * One RAW rung of the L1 → L2 → L3 approval ladder of a service, as the
 * backend groups the nine flat `L*_Approver_*` / `L*_Escalated_Remark` columns
 * the procedure emits.
 *
 * The rungs are not one table, which is why L1 can name someone the escalation
 * config does not:
 *
 *   • L1 is the ordinary approver from CRQ_CAB_SERVICE_APPROVAL_CONFIG_TBL
 *     (Service_Code + Circle_Code, Is_Active = 1) — the very column the proc
 *     used to publish unprefixed as Approver_Olm_Id / Approver_Name.
 *   • L2 and L3 come from CRQ_CAB_SERVICE_ESCALATION_TBL. That table has its
 *     own L1 columns which the procedure deliberately ignores.
 *
 * `escalated` is the RAW mirror of the proc's `L*_Escalated_Remark`, set only
 * when CRQ_CAB_SERVICE_TBL.Is_Escalated = 1 and its Escalation_Level enum names
 * this rung — so at most one rung of a row is ever flagged, and none being
 * flagged means the approval was never escalated and still sits with L1.
 *
 * Read it as "the approval is ON this rung", never as "it escalated to get
 * here": a flagged L1 is the ordinary state of a service that merely has
 * escalation TRACKING enabled and has not moved. Whether a service has really
 * escalated is `PendingApprovalView.escalated`, which tests the live rung
 * against L1 instead of testing this flag for presence.
 */
export interface CrqApproverLevel {
  level: ApproverLevelKey;
  olmId: string | null;
  name: string | null;
  escalated: boolean;
}

/**
 * One RAW row of result set 2 of sp_get_crq_journey_page — a CAB service linked
 * to this CRQ, its decision state, and the ladder configured to decide it.
 *
 * **The name lies: this is no longer a pending-only set.** The procedure was
 * re-authored on 2026-09-09 and now emits every CRQ_CAB_SERVICE_TBL row for the
 * CRQ whatever its Status, while still naming the column it identifies them by
 * `Pending_Service_Code`. `status` is what separates open work from decided
 * work; counting rows instead over-counts. Its rough edges are handled in
 * `summarizeServiceApprovals` rather than in SQL, the procedure being read-only
 * for this feature:
 *
 *   • `serviceCode` is the raw CRQ_CAB_SERVICE_MASTER code ("B2B", "IWAN",
 *     "MOB") while result set 1 names the very same services by their display
 *     name — the same service would otherwise appear under two different labels
 *     on one page.
 *   • One row is emitted per CRQ_CAB_SERVICE_TBL row, so a service with several
 *     rows repeats verbatim. Both approver joins are uncapped LEFT JOINs too, so
 *     a circle with more than one active config row repeats it once more again.
 *   • `serviceCode` doubles as a sentinel channel: the literal 'NO SERVICES'
 *     arrives as the only row, status and all three rungs null, when the CRQ has
 *     no CAB service. The older 'NO SERVICES PENDING' sentinel is gone — now
 *     that decided services are included, "all decided" is something `status`
 *     says directly.
 *   • `status` is the CRQ_CAB_SERVICE_TBL enum, which has a fourth value —
 *     RESCHEDULED — that this feature's three-way vocabulary has no slot for.
 *
 * A null rung is a genuine config gap, not a failed lookup.
 */
export interface CrqPendingApproval {
  serviceCode: string | null;
  status: string | null;
  l1: CrqApproverLevel | null;
  l2: CrqApproverLevel | null;
  l3: CrqApproverLevel | null;
}

/** One rung as the UI reads it — the raw rung plus where it sits in the ladder. */
export interface ApproverLevelView extends CrqApproverLevel {
  /** The rung the approval is sitting on right now: the escalated one, or L1 when none is. */
  current: boolean;
  /** Somebody is configured on this rung. */
  configured: boolean;
}

/**
 * One CAB service approval as the UI shows it: the raw rows above,
 * de-duplicated, given the display name result set 2 doesn't carry, and with
 * the ladder resolved down to whoever actually owes the decision now.
 */
export interface PendingApprovalView {
  /** Raw code from the proc — "B2B", "IWAN", "MOB". Always present. */
  serviceCode: string;
  /** Display name resolved from result set 1 / the service master; falls back to the code. */
  serviceName: string;
  /** False when the code could not be resolved and `serviceName` is just the code echoed back. */
  nameResolved: boolean;
  /** Decision state, from the row's own Status column — decided services are in this set now too. */
  status: ApprovalStatus;
  /** How many still-PENDING CRQ_CAB_SERVICE_TBL rows this one line stands for; 0 once decided. */
  pendingCount: number;
  /** The full ladder, always three entries in L1 → L2 → L3 order however sparsely configured. */
  chain: ApproverLevelView[];
  /** The rung the approval currently sits on. L1 unless the proc flagged an escalation. */
  currentLevel: ApproverLevelKey;
  /**
   * The approval has genuinely moved off its first approver, i.e. `currentLevel`
   * is L2 or L3. NOT the presence of the proc's ESCALATED flag: that flag also
   * fires on L1 for any service with escalation tracking switched on, which is
   * the resting state of a brand-new CRQ rather than an escalation.
   */
  escalated: boolean;
  /** Current rung's approver — who owes the decision now, not necessarily L1. */
  approverOlmId: string | null;
  approverName: string | null;
  /** Somebody is configured on the current rung, i.e. there is someone to route this to. */
  configured: boolean;
}

/**
 * One RAW row of the SPOC result set of sp_get_crq_journey_page (added to the
 * procedure on 2026-09-08) — the single point of contact recorded against one
 * CAB service of this CRQ.
 *
 * Exactly the three columns the procedure emits, untouched. It differs from
 * `CrqPendingApproval` in ways that matter when merging the two:
 *
 *   • it covers EVERY service linked to the CRQ, not only the pending ones, so
 *     it is the closest thing the payload has to a service roster;
 *   • `serviceCode` is again the raw master code — the procedure resolves the
 *     display name internally but does not select it;
 *   • `serviceCode` doubles as a sentinel channel: the literal 'NO SERVICES'
 *     arrives as the only row, both SPOC fields null, when the CRQ has none;
 *   • it is produced by an INNER JOIN to CRQ_CAB_SERVICE_MASTER, so a service
 *     whose code has since been dropped from that master vanishes from here
 *     while still appearing in the pending set — which is why this array can be
 *     empty for a CRQ that demonstrably has services.
 *
 * Both SPOC fields are frequently null: they are optional columns that only get
 * filled in once someone actually records a contact.
 */
export interface CrqServiceSpoc {
  serviceCode: string | null;
  spocName: string | null;
  spocContact: string | null;
}

/** One recorded contact — kept as a pair because a service can carry more than one. */
export interface ServiceSpocContact {
  name: string | null;
  contact: string | null;
}

/**
 * One CAB service of the CRQ as the roster panel shows it: the SPOC rows, the
 * pending-approval rows and the journey rows merged into a single line per
 * service, so a reader sees who owns a service and who owes a decision on it
 * side by side instead of in two disconnected lists.
 */
export interface ServiceRosterRow {
  /** Raw master code — always present, and the key the three result sets agree on. */
  serviceCode: string;
  /** Display name resolved from the journey rows / the mirrored master map; falls back to the code. */
  serviceName: string;
  /** False when the code could not be resolved and `serviceName` is just the code echoed back. */
  nameResolved: boolean;
  /** Decision state; null only when the service is in neither the approval set nor a journey row. */
  status: ApprovalStatus | null;
  /** Open CRQ_CAB_SERVICE_TBL rows behind this line — 0 once the service is decided. */
  pendingCount: number;
  /**
   * The approval ladder for this service. Present on DECIDED services too since
   * the 2026-09-09 proc revision started reporting them — read `status` before
   * phrasing it as "awaiting", or a decided row will contradict its own badge.
   * Null only for a service the approval set never mentioned at all.
   */
  approver: PendingApprovalView | null;
  /** Distinct contacts recorded against this service; empty when nobody filled them in. */
  spocs: ServiceSpocContact[];
  /** How many CRQ_CAB_SERVICE_TBL rows this line stands for, SPOC set permitting. */
  serviceRows: number;
  /** The service is in the SPOC result set — i.e. its code still resolves in the service master. */
  inSpocSet: boolean;
}

/** Result set 4 of sp_get_crq_journey_page — the CRQ's org scope. */
export interface CrqJourneyScope {
  domainName: string | null;
  subDomainName: string | null;
}

/** GET /crqworkflow/journey-explorer/{crqNo} — all four result sets in one payload. */
export interface CrqJourneyPageResponse {
  stages: CrqJourneyStageRow[];
  pendingApprovals: CrqPendingApproval[];
  /** Empty on a database still running a pre-2026-09-08 revision of the proc. */
  serviceSpocs: CrqServiceSpoc[];
  scope: CrqJourneyScope | null;
}

/** Result set 1 of get_crq_details — the CRQ info card. */
export interface CrqDetailsInfo {
  crqNo: string;
  currentStage: string;
  currentStatus: string;
  teamFunction: string | null;
  teamSubFunction: string | null;
  createdDate: string | null;
  remark: string | null;
}

/** Result set 2 of get_crq_details — one row per canonical workflow stage. */
export interface CrqDetailsStage {
  stage: string;
  stageStatus: string;
  isCurrent: boolean;
  assignedTo: string | null;
  performedBy: string | null;
  assignStart: string | null;
  assignEnd: string | null;
  stageStartDate: string | null;
  stageEndDate: string | null;
}

export interface CrqDetailsResponse {
  info: CrqDetailsInfo | null;
  stages: CrqDetailsStage[];
}

// ─── Feature 1 (/cabmanager/journey) — grouped, dynamic-length flow ──────────
//
// sp_get_crq_journey_page emits one flat (STAGE, STATUS) list, built in three
// appends — verified against the live routine body on 2026-09-08, when it was
// last re-authored:
//   1. 0..N linked CAB service rows, named from CRQ_CAB_SERVICE_MASTER
//      (B2B, IWAN, B2C-HOMES, …) — names are NOT unique, the same service can
//      appear several times, once per CRQ_CAB_SERVICE_TBL row.
//   2. CONFLICT CHECK  (exactly 1 row) — YES/NO
//   3. the 7 canonical workflow stages, always present, fixed order:
//      VALIDATE · IMPACT ANALYSIS · MOP CREATE · MOP VALIDATE · SCHEDULING ·
//      IMPLEMENTATION · CLOSURE
//      Status = APPROVED for stages before the current one, the CRQ's live
//      current_status (underscores → hyphens) for the current one, PENDING
//      after it — or NA after it once the CRQ is CANCELLED.
//
// Everything about that list has moved at least once: the services used to be
// appended last and are now first, the stages have been spelled both
// VALIDATE / IMPLEMENTATION and Plan & Inventory / Activity_Implement, and the
// CAB session-mapping row that used to sit between the services and the
// conflict row is no longer emitted at all.
//
// groupJourneyStages() therefore resolves this by NAME rather than by position,
// accepts every spelling seen in the field, and leaves any slot the routine
// stopped emitting as null — so a re-ordering, a rename or a dropped row can
// neither shift stages into the approvals bucket nor break the canvas.

export interface CrqJourneyFlow {
  /** Legacy slot — the current routine no longer emits SPOC/FE ASSIGNMENT, kept so an older DB still renders. */
  assignment: CrqJourneyStageRow | null;
  approvals: CrqJourneyStageRow[];
  /** YES = CRQ is mapped into a CAB session. */
  cab: CrqJourneyStageRow | null;
  conflictCheck: CrqJourneyStageRow | null;
  validate: CrqJourneyStageRow | null;
  impactAnalysis: CrqJourneyStageRow | null;
  mopCreate: CrqJourneyStageRow | null;
  mopValidate: CrqJourneyStageRow | null;
  scheduling: CrqJourneyStageRow | null;
  implementation: CrqJourneyStageRow | null;
  closure: CrqJourneyStageRow | null;
}
