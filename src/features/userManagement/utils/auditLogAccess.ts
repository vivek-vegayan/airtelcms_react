/**
 * Who may see the Audit Log.
 *
 * This is the browser-side half of one rule. The authoritative half lives in
 * `sp_get_ui_actions_log_access`, which the backend consults before answering
 * any audit request — so a user who gets past this predicate still gets a 403,
 * and a user this predicate hides the screen from could not read the data even
 * if they typed the URL.
 *
 * The two role codes are kept identical to that procedure's IN list on purpose:
 *
 *   SUPER_ADMIN          — the customer's own super admin (ROLE_MASTER 1)
 *   VEGAYAN_SUPER_ADMIN  — the vendor's super admin (ROLE_MASTER 19), which
 *                          already owns the equally-restricted SFTP module
 *
 * Deliberately NOT gated on a WEB_MODULE / WEB_SUB_MODULE grant like the rest
 * of the nav. A grant is editable from Global Settings, so gating on one would
 * let an administrator hand the audit trail to an ordinary role — at which
 * point the sidebar would offer a screen the server still refuses. "Super admin
 * only" has to mean the role, not a permission row.
 *
 * Kept separate from `isSuperAdminRole` in rbac/permissionCore, which answers a
 * narrower question (SUPER_ADMIN alone) and is used elsewhere; widening that
 * one would have changed unrelated behaviour.
 */

const AUDIT_LOG_ROLES = ["SUPER_ADMIN", "VEGAYAN_SUPER_ADMIN"] as const;

export const canViewAuditLog = (roleCode: string | null | undefined): boolean =>
  !!roleCode && (AUDIT_LOG_ROLES as readonly string[]).includes(roleCode);
