/**
 * Cancelled CRQ registry — the consolidated, read-only view of every CRQ that
 * ended in cancellation, across all seven workflow stages.
 *
 * Backed by GET /crqworkflow/cancelled (+ /summary), which call the
 * Get_Cancelled_CRQ_List / Get_Cancelled_CRQ_Summary procedures added in
 * airtelmanagement db/migration/2026-09-03_cancelled_crq_registry.sql.
 *
 * "Cancelled" means CRQ_MASTER_TBL.current_status = 'CANCELLED' (the enum,
 * double L). The single-L 'canceled' string seen elsewhere in the app is only
 * a display label the stage procedures render for a status chip, and the
 * presence of a CRQ_CANCEL_TBL audit row does not mean a CRQ is cancelled —
 * one can be cancelled, rolled back and be running again.
 */

/** One cancelled CRQ. Mirrors backend schedular/dto/CancelledCrqDto.java. */
export interface CancelledCrq {
  // Identity
  crqNo: string;
  crqId: number;
  planNumber: string | null;
  planType: string | null;

  // State at the moment of cancellation
  /** Stage the CRQ was actually cancelled in — raw enum, e.g. MOP_VALIDATION. */
  cancelledStage: string | null;
  currentStage: string | null;
  /** Raw CRQ_MASTER_TBL.current_status — always "CANCELLED" on this screen. */
  currentStatus: string | null;
  crqStatus: string | null;

  // Why / who / when
  cancellationReason: string | null;
  /** "Cancellation" or "Rejection". */
  cancellationType: string | null;
  cancelStatus: string | null;
  rollbackOwner: string | null;
  remark: string | null;
  cancelledBy: string | null;
  cancelledByName: string | null;
  cancelledAt: string | null;
  /** "Remedy" when pushed in by Remedy, "CHM" when raised in this app. */
  cancelledSource: string | null;
  daysToCancel: number | null;

  // Org scope
  domainId: number | null;
  subDomainId: number | null;
  domainName: string | null;
  subDomainName: string | null;
  functionId: number | null;
  functionName: string | null;
  verticalId: number | null;
  verticalName: string | null;
  crqCircle: string | null;

  // Planned windows
  executionSlotStart: string | null;
  executionSlotEnd: string | null;
  requestedStartDate: string | null;
  requestedEndDate: string | null;
  enteredCurrentStageAt: string | null;
  raisedAt: string | null;
  closedAt: string | null;
  rescheduleCount: number | null;

  // Stage ownership at cancellation
  assignedOlmid: string | null;
  performedByOlmid: string | null;
  stageStartedAt: string | null;

  // Remedy descriptors (CRQ_DETAIL_TBL — an empty feed in the current
  // environment, so these are null today and light up when it populates)
  description: string | null;
  detailedDescription: string | null;
  typeOfCr: string | null;
  remedyChangeImpact: string | null;
  supportOrganization: string | null;
  supportGroupName: string | null;
  categorizationTier1: string | null;
  categorizationTier2: string | null;
  categorizationTier3: string | null;
  ascpy: string | null;
  asorg: string | null;
  asgrp: string | null;
  company3: string | null;

  // Task roll-up — the CRQ's tasks folded into one row so the register stays
  // one line per CRQ rather than one line per task.
  taskCount: number | null;
  taskIds: string | null;
  neLabels: string | null;
  taskActivities: string | null;
}

/** Mirrors backend common/dto/PageResponseDto.java. */
export interface CancelledCrqPage {
  content: CancelledCrq[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Mirrors backend schedular/dto/CancelledCrqSummaryDto.java. */
export interface CancelledCrqSummary {
  totalCancelled: number | null;
  cancelledLast30Days: number | null;
  cancelledThisMonth: number | null;
  affectedDomains: number | null;
  topStage: string | null;
  topStageCount: number | null;
  topReason: string | null;
  topReasonCount: number | null;
}

/**
 * Query scope shared by the list and the summary. Every org level is
 * optional and independent: an omitted level is not filtered on at all, so
 * the page opens on the caller's entire cancelled population.
 */
export interface CancelledCrqFilters {
  verticalId?: number;
  functionId?: number;
  domainId?: number;
  subDomainId?: number;
  search?: string;
}
