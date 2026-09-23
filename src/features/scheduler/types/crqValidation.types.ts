/**
 * Wire shapes of /crqworkflow/validation/* (CrqValidationController), which
 * drives get_crq_validation_details / update_validation_details
 * (db/migration/2026-07-28_crq_validation_details.sql).
 *
 * Every field here comes from a procedure result set - nothing is synthesised
 * client-side.
 */

import type { CrqStageEnum } from "./reschedule.types";

/**
 * GET /crqworkflow/validation/details?crqNo= - one row of
 * get_crq_validation_details.
 *
 * `nodeName` / `nameInterfacePair` are null until the CRQ has been validated
 * once: the procedure LEFT JOINs, so an unvalidated CRQ still returns its
 * identity and stage rather than nothing at all.
 */
export interface CrqValidationDetails {
  crqNo: string;
  planId: number | null;
  nodeName: string | null;
  nameInterfacePair: string | null;
  /** CRQ_MASTER_TBL.current_stage - read-only header context. */
  currentStage: CrqStageEnum | null;
  /** CRQ_MASTER_TBL.current_status - shown as "Validation Status". */
  validationStatus: string | null;
  /** Last save, `yyyy-MM-ddTHH:mm:ss`; null when never validated. */
  updatedAt: string | null;
}

/**
 * POST /crqworkflow/validation/save - the three arguments of
 * update_validation_details. Responds with the refreshed
 * CrqValidationDetails row.
 */
export interface CrqValidationSaveRequest {
  crqNo: string;
  nodeName: string;
  nameInterfacePair: string;
}

