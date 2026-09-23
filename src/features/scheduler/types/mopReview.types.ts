import type { MopDocumentType } from "./mopDocument.types";
import type { MopVersionStatus } from "./mopValidate.types";

/** `mop_finding.state`. Only `open` blocks validation. */
export type MopFindingState = "open" | "resolved" | "withdrawn";

/** One finding raised against a version. `findingRef` ("F-01") is per version. */
export interface MopFinding {
  findingId: number;
  findingRef: string;
  versionId: number;
  /** Page of the document it was raised against, null when raised generally. */
  pageNo: number | null;
  /** Free-text step reference; null unless one was named. */
  stepRef: string | null;
  description: string;
  state: MopFindingState;
  /** OLM id - `app_user` is empty so no name resolves. */
  raisedBy: string | null;
  raisedAt: string | null;
  resolvedAt: string | null;
}

/** One row of the History tab. */
export interface MopVersionSummary {
  versionId: number;
  versionNo: number;
  status: MopVersionStatus;
  note: string | null;
  uploadedBy: string | null;
  uploadedAt: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  openFindingCount: number;
}

/** One line of the audit trail, written by `sp_mop_audit_add`. */
export interface MopAuditEntry {
  auditId: number;
  versionId: number | null;
  actorId: string | null;
  eventType: string;
  detail: string | null;
  createdAt: string | null;
}

/**
 * Everything the validation workspace renders, from
 * `GET /crqworkflow/mopvalidate/{crqNo}/workspace`.
 *
 * One payload rather than several queries because the rail's tabs, the viewer's
 * header and the decision buttons all have to agree about which version is
 * being acted on - fetched separately they would disagree for a frame after
 * every write, and the "open findings block validation" rule would flicker.
 *
 * Every write endpoint answers with this same shape, so an action never needs a
 * follow-up read.
 */
export interface MopReviewWorkspace {
  crqNo: string | null;

  /** False when MOP Create has not run - nothing to validate. */
  mopExists: boolean;

  mopId: number | null;

  title: string | null;

  mopStatus: string | null;

  windowStart: string | null;

  windowEnd: string | null;

  region: string | null;

  vendor: string | null;

  // ---- the version being viewed ----
  versionId: number | null;
  versionNo: number | null;
  versionStatus: MopVersionStatus | null;
  versionNote: string | null;
  pageCount: number | null;
  uploadedAt: string | null;
  uploadedBy: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionNote: string | null;

  // ---- the stored document ----
  /** `mop_file.original_name`. Present even before any bytes are uploaded. */
  fileName: string | null;
  /** True only when CRQ_PDF_TBL actually holds bytes for this CRQ. */
  documentAttached: boolean;
  documentType: MopDocumentType | null;

  // ---- review state ----
  reviewOpen: boolean;
  reviewId: number | null;
  reviewerId: string | null;
  reviewStartedAt: string | null;
  reviewOwnedByMe: boolean;
  /** OLM id of whoever is asking - the design's "Reviewer" field. */
  currentReviewerId: string | null;

  // ---- collections ----
  versions: MopVersionSummary[];
  findings: MopFinding[];
  audit: MopAuditEntry[];

  // ---- derived flags ----
  openFindingCount: number;
  latestVersionId: number | null;
  latestVersionNo: number | null;
  /** True when a superseded version is being viewed - the rail goes read-only. */
  viewingOld: boolean;
  /** True when this version can still be acted on. */
  canEdit: boolean;
}

/** Body of the raise-a-finding call. */
export interface AddMopFindingArgs {
  crqNo: string;
  versionId: number;
  pageNo: number | null;
  stepRef: string | null;
  description: string;
}

export interface SetMopFindingStateArgs {
  crqNo: string;
  findingId: number;
  state: MopFindingState;
}

export interface MopDecisionArgs {
  crqNo: string;
  versionId: number;
  /** Validation note, kept on the version and in the audit record. */
  note?: string;
  /** Rejection reason - the procedure requires a non-empty one. */
  reason?: string;
  /** The procedure's own override for validating while findings are open. */
  force?: boolean;
}
