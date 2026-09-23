/**
 * Audit Log types — the wire shape of GET /audit-logs and /audit-logs/filters.
 *
 * Field names mirror `AuditLogDto` / `AuditLogFiltersDto` on the backend, which
 * in turn mirror the column aliases of `sp_get_ui_actions_log`
 * (airtelmanagement/db/migration/2026-09-04_ui_actions_audit_log.sql).
 */

/** The verbs the audit trail records. Kept as a union of the values the
 *  backend's `AuditAction` constants produce, plus a string fallback so an
 *  action added there later renders instead of breaking the table. */
export type AuditActionCode =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "UPLOAD"
  | "DOWNLOAD"
  | "ASSIGN"
  | "UNASSIGN"
  | "ENABLE"
  | "DISABLE"
  | "SUBMIT"
  | "CANCEL"
  | "RESCHEDULE"
  | "LOGIN"
  | "LOGOUT"
  | "START"
  | "PAUSE"
  | "COMPLETE"
  | "DELEGATE"
  | "VALIDATE"
  | (string & {});

export interface AuditLogEntry {
  logId: number;
  module: string;
  subModule: string | null;
  action: AuditActionCode;

  // Who did it
  actorUserId: number | null;
  actorOlmid: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;

  // Who it was done to — null for actions that target no person
  affectedUserId: number | null;
  affectedOlmid: string | null;
  affectedName: string | null;
  affectedEmail: string | null;

  remark: string | null;

  /**
   * The database-generated timestamp, full precision. NEVER derived in the
   * browser — the audit time is whatever MySQL recorded at INSERT.
   */
  createdAt: string;
  /** Pre-split by the procedure — "2026-09-04". */
  actionDate: string | null;
  /** Pre-split by the procedure — "10:30:25". */
  actionTime: string | null;
}

/** Matches the backend's shared PageResponseDto envelope. */
export interface AuditLogPage {
  content: AuditLogEntry[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AuditUserOption {
  userId: number;
  /** "Name (OLMID)" — built by the procedure, not concatenated here. */
  label: string;
}

export interface AuditLogFilterOptions {
  modules: string[];
  subModules: string[];
  actions: AuditActionCode[];
  actors: AuditUserOption[];
  affectedUsers: AuditUserOption[];
}

/** Everything the filter bar can narrow on. All optional. */
export interface AuditLogFilters {
  module?: string;
  subModule?: string;
  action?: string;
  actorUserId?: number;
  affectedUserId?: number;
  /** ISO date, inclusive — the backend widens it to the whole day. */
  fromDate?: string;
  /** ISO date, inclusive — the backend widens it to the whole day. */
  toDate?: string;
  search?: string;
}

export type AuditSortDirection = "asc" | "desc";

export interface AuditLogQueryArgs extends AuditLogFilters {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: AuditSortDirection;
}
