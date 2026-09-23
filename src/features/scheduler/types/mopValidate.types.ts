/**
 * Lifecycle of a single MOP version (`mop_version.status`). Distinct from
 * `mop.status`, which tracks the MOP record as a whole - a version can be
 * superseded while the MOP itself is still in review.
 */
export type MopVersionStatus =
  | "pending_validation"
  | "in_review"
  | "rejected"
  | "validated"
  | "superseded";

/**
 * MOP Validate stage preview, from
 * `GET /crqworkflow/mopvalidate/{crqNo}/details`.
 *
 * The version is located by `SP_GET_MOP_CURRENT_VERSION`, which returns only
 * `mop.current_version_id`; the rest is read off `mop_version` / `mop_file` /
 * `mop_review`. Three distinct "nothing to show" states are worth telling
 * apart, so each has its own flag rather than being collapsed into an error:
 *
 *  - the CRQ does not exist at all -> 404, never this shape;
 *  - the CRQ has no MOP record yet (`mopExists` false) -> MOP Create has not
 *    run;
 *  - the MOP exists but has no version (`versionId` null).
 */
export interface MopValidateDetails {
  /** CRQ number. Always present. */
  crqNo: string | null;

  /** False when MOP Create has not run for this CRQ - nothing to validate. */
  mopExists: boolean;

  /** `mop.mop_id`, or null when no MOP exists. */
  mopId: number | null;

  /** `mop.status` - the record-level lifecycle. */
  mopStatus: string | null;

  /** `mop.current_version_id`. Null when the MOP carries no version yet. */
  versionId: number | null;

  /** `mop_version.version_no` - 1 for the initial submission. */
  versionNo: number | null;

  versionStatus: MopVersionStatus | null;

  /** `mop_version.note` - "Initial submission" on a v1. */
  note: string | null;

  /** Null until a document has actually been measured. */
  pageCount: number | null;

  /** ISO-8601. */
  uploadedAt: string | null;

  /** OLM id, not a name: `app_user` is empty so no name can be resolved. */
  uploadedBy: string | null;

  decidedAt: string | null;

  decidedBy: string | null;

  decisionNote: string | null;

  /** `mop_file.original_name` of the version's mop_document. */
  fileName: string | null;

  mimeType: string | null;

  /**
   * `mop_file.size_bytes`. 0 on the placeholder row the create procedure
   * writes - the file record is created before any bytes exist.
   */
  sizeBytes: number | null;

  /** True while an `outcome = 'open'` review stands against this version. */
  reviewOpen: boolean;

  reviewId: number | null;

  /** OLM id of whoever opened the review. */
  reviewerId: string | null;

  reviewStartedAt: string | null;

  /** True when that open review is the asking user's own. */
  reviewOwnedByMe: boolean;
}

export const MOP_VERSION_STATUS_LABEL: Record<MopVersionStatus, string> = {
  pending_validation: "Pending validation",
  in_review: "In review",
  rejected: "Rejected",
  validated: "Validated",
  superseded: "Superseded",
};
