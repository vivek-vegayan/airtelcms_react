/**
 * Format of the MOP document stored for a CRQ.
 *
 * `CRQ_PDF_TBL` holds one row per CRQ with a single content column and no
 * MIME or filename column, so the backend sniffs this from the stored bytes.
 * It also means a CRQ carries one MOP document in one format - uploading
 * either kind replaces whatever was there.
 */
export type MopDocumentType = "PDF" | "XLSX" | "XLS";

/**
 * Lifecycle of the MOP record itself (`mop.status`), separate from the
 * document attached to the CRQ.
 */
export type MopStatus =
  | "draft"
  | "pending_validation"
  | "in_review"
  | "rejected"
  | "validated"
  | "cancelled";

/**
 * MOP Create stage details, from `GET /crqworkflow/mopcreate/{crqNo}/details`.
 *
 * The first six fields are the columns `SP_GET_MOP_DETAILS_BY_CRQN` returns -
 * `crq_number`, `title`, `window_start`, `window_end`, `region`, `vendor` -
 * but that procedure is a *create*, not a read: it inserts the `mop` row and
 * refuses a second call. The backend serves this header by reading those same
 * columns back off that row, so everything except `crqNo` is null until the
 * MOP has actually been created (`mopExists`).
 */
export interface MopCreateDetails {
  /** CRQ number. Always present - the CRQ is what was looked up. */
  crqNo: string | null;

  /** Plan type from CRQ_PLAN_TBL, used as the MOP title. */
  title: string | null;

  /** Execution start of the current schedule, ISO-8601. */
  windowStart: string | null;

  /** Execution end of the current schedule, ISO-8601. */
  windowEnd: string | null;

  /**
   * Region and vendor both come from `CRQ_DETAIL_TBL`, which is still empty in
   * every environment - they are expected to be null today and render as a
   * dash rather than being hidden, so they light up on their own once that
   * table is populated.
   */
  region: string | null;

  vendor: string | null;

  /** False until the MOP record has been created for this CRQ. */
  mopExists: boolean;

  /** `mop.mop_id`, or null when no MOP has been created yet. */
  mopId: number | null;

  /** Lifecycle of the MOP record, or null when none has been created. */
  mopStatus: MopStatus | null;

  /** True when a MOP document is already stored against this CRQ. */
  documentAttached: boolean;

  /** Format of that document, or null when none is attached. */
  documentType: MopDocumentType | null;
}

/** Raw-file ceiling enforced by the backend, mirrored here so the drop zone
 *  can reject an oversized file before spending an upload on it. Keep in step
 *  with `MOP_PDF_MAX_BYTES` in `CrqWorkflowService`. */
export const MOP_PDF_MAX_BYTES = 25 * 1024 * 1024;

/** What the file input offers and the drop zone accepts. */
export const MOP_ACCEPT_ATTR = ".pdf,.xlsx,.xls,application/pdf";

/** Extension the download uses, matching what the backend stored. */
export const MOP_EXTENSION: Record<MopDocumentType, string> = {
  PDF: "pdf",
  XLSX: "xlsx",
  XLS: "xls",
};

export const MOP_TYPE_LABEL: Record<MopDocumentType, string> = {
  PDF: "PDF",
  XLSX: "Excel",
  XLS: "Excel (legacy)",
};

/** `mop.status` as it is shown in the header. */
export const MOP_STATUS_LABEL: Record<MopStatus, string> = {
  draft: "Draft",
  pending_validation: "Pending validation",
  in_review: "In review",
  rejected: "Rejected",
  validated: "Validated",
  cancelled: "Cancelled",
};
