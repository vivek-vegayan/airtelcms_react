/**
 * Wire shapes of /crqworkflow/reschedule/* (CrqRescheduleController), which
 * drives the CRQ_SP_RESCHEDULE_* procedures. Every field here is returned by a
 * procedure - nothing is synthesised client-side.
 */

/** Every reschedule procedure answers with one of these in its status column. */
export type RescheduleCallStatus = "success" | "partial" | "blocked" | "error";

/** CRQ_RESCHEDULE_TBL.reschedule_status - the attempt's own lifecycle. */
export type RescheduleAttemptStatus =
  | "INITIATED"
  | "DATE_SELECTED"
  | "STAGE_MOVED"
  | "SLOT_CONFIRMED"
  | "CANCELLED"
  | "FAILED";

/** CRQ_MASTER_TBL.current_stage enum. */
export type CrqStageEnum =
  | "VALIDATE"
  | "IMPACT_ANALYSIS"
  | "MOP_CREATION"
  | "MOP_VALIDATION"
  | "SCHEDULING_APPROVAL"
  | "EXECUTION"
  | "CLOSURE";

/** GET /context - CRQ_SP_RESCHEDULE_CONTEXT. */
export interface RescheduleContext {
  status: RescheduleCallStatus;
  message: string | null;
  crqId: number;
  crqNo: string;
  currentStage: CrqStageEnum;
  currentStatus: string | null;
  rescheduleCount: number | null;
  maxReschedules: number | null;
  rescheduleBlocked: boolean;
  /** False when the CRQ is closed, on manual hold, out of attempts or has no task. */
  canReschedule: boolean;
  blockedReason: string | null;
  planNo: string | null;
  /**
   * Scheduling-engine coordinates the CRQ is actually booked under, resolved
   * by CRQ_SP_RESCHEDULE_RESOLVE_CRQ from the CRQ's own reservation. Kept for
   * diagnostics: a reschedule is scoped to the CRQ, never to a task.
   */
  taskRowId: number | null;
  taskId: string | null;
  /** How many tasks the CRQ has - all of them move with the CRQ's schedule. */
  taskCount: number | null;
  engineerOlmId: string | null;
  engineerName: string | null;
  shiftLetter: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  /**
   * Stages strictly before the current one, derived by the procedure with the
   * same rule CRQ_SP_RESCHEDULE_MOVE_STAGE validates against - never a
   * client-side transition map.
   */
  eligibleStages: CrqStageEnum[];
  /** Set when an earlier attempt was left in flight, so the wizard can resume it. */
  activeRescheduleId: number | null;
  activeRescheduleStatus: RescheduleAttemptStatus | null;
  activeDesiredDate: string | null;
  activeToStage: CrqStageEnum | null;
  activeActivityEpoch: string | null;
}

/**
 * POST /initiate - CRQ_SP_RESCHEDULE_INITIATE. Carries the scheduling calendar
 * alongside the new attempt, since the procedure computes both in one call.
 */
export interface RescheduleInitiateResponse {
  status: RescheduleCallStatus;
  message: string | null;
  rescheduleId: number | null;
  activityEpoch: string | null;
  startDate: string | null;
  endDate: string | null;
  busyDates: string | null;
  weekendDates: string | null;
  holidayDates: string | null;
  networkFreeDates: string | null;
}

/**
 * GET /calendar - Get_Predicted_SlotDates_Reschedule. The four date buckets
 * arrive as comma-separated `yyyy-MM-dd` strings (GROUP_CONCAT output).
 */
export interface RescheduleCalendar {
  status: RescheduleCallStatus;
  message: string | null;
  startDate: string | null;
  endDate: string | null;
  busyDates: string | null;
  weekendDates: string | null;
  holidayDates: string | null;
  networkFreeDates: string | null;
}

/** Same payload with the CSV buckets already split - what the calendar renders. */
export interface RescheduleCalendarModel {
  message: string | null;
  startDate: string | null;
  endDate: string | null;
  busyDates: Set<string>;
  weekendDates: Set<string>;
  holidayDates: Set<string>;
  networkFreezeDates: Set<string>;
}

/** POST /save-date, /cancel. */
export interface RescheduleStatusResponse {
  status: RescheduleCallStatus;
  message: string | null;
}

/** GET /reason-options - sp_reschedule_reason_drop_down. */
export interface RescheduleReasonOption {
  reason: string;
}

/** One offered slot from CRQ_SP_RESCHEDULE_GET_SLOTS. */
export interface RescheduleSlot {
  /** Primary key of the offer - passed back verbatim to confirm-slot. */
  label: string;
  startDateTime: string;
  endDateTime: string;
  engineerOlmId: string | null;
  engineerName: string | null;
  shiftLetter: string | null;
  freeMinutes: number | null;
  durationMinutes: number | null;
  /** USER_MASTER.job_level of the offered engineer; absent for unmapped OLM ids. */
  skillLevel: string | null;
}

/** GET /{rescheduleId}/slots - CRQ_SP_RESCHEDULE_GET_SLOTS. */
export interface RescheduleSlotsResponse {
  status: RescheduleCallStatus;
  message: string | null;
  slots: RescheduleSlot[];
}

/**
 * POST /move-stage - CRQ_SP_RESCHEDULE_MOVE_STAGE. Returns the recomputed
 * offer window with the stage change; `slots` is empty on a "partial" status,
 * meaning the move committed but the slot computation behind it did not.
 */
export interface RescheduleMoveStageResponse {
  status: RescheduleCallStatus;
  message: string | null;
  slots: RescheduleSlot[];
}

/** POST /confirm-slot - CRQ_SP_RESCHEDULE_CONFIRM_SLOT. */
export interface RescheduleConfirmResponse {
  status: RescheduleCallStatus;
  message: string | null;
  scheduleId: number | null;
  engineerOlmId: string | null;
  engineerName: string | null;
  shiftLetter: string | null;
  slotStart: string | null;
  slotEnd: string | null;
}
