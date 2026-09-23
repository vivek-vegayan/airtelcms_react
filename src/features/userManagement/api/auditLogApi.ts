import { api } from "../../../service/api";
import type {
  AuditLogFilterOptions,
  AuditLogPage,
  AuditLogQueryArgs,
} from "../types/auditLog";

/**
 * Audit Log endpoints — User Management → Audit Log.
 *
 * Read-only on purpose: there is no mutation here and there should never be.
 * Audit rows are written by the backend as a side effect of the actions they
 * describe, so a client-callable write would be a way to forge history.
 *
 * Both endpoints are refused with 403 for anyone who is not a super admin. The
 * screen hides itself from those users, but that is a convenience — the server
 * is what actually enforces it.
 *
 * Every filter is applied by the database (`sp_get_ui_actions_log`), not here:
 * the table is expected to reach millions of rows, so nothing is ever fetched
 * in order to be discarded in React.
 */

const BASE = "/audit-logs";

const AUDIT_LOG_TAG = { type: "AuditLog" as const, id: "LIST" as const };

/** Drops every unset filter so it never reaches the query string — an absent
 *  parameter is what makes the backend not narrow on it at all. */
const cleanParams = (args: AuditLogQueryArgs) => {
  const {
    module,
    subModule,
    action,
    actorUserId,
    affectedUserId,
    fromDate,
    toDate,
    search,
    page,
    size,
    sortBy,
    sortDirection,
  } = args;

  return {
    module: module || undefined,
    subModule: subModule || undefined,
    action: action || undefined,
    actorUserId: actorUserId || undefined,
    affectedUserId: affectedUserId || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    search: search?.trim() || undefined,
    sortBy: sortBy || undefined,
    sortDirection: sortDirection || undefined,
    page,
    size,
  };
};

export const auditLogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /audit-logs — one server-paged, server-filtered, server-sorted page.
    getAuditLogs: builder.query<AuditLogPage, AuditLogQueryArgs>({
      query: (args) => ({
        url: BASE,
        method: "GET",
        params: cleanParams(args),
      }),
      providesTags: [AUDIT_LOG_TAG],
    }),

    // GET /audit-logs/filters — dropdown contents, derived from rows that
    // exist. `module` narrows the Sub Module facet to the selected module.
    getAuditLogFilters: builder.query<AuditLogFilterOptions, string | undefined>({
      query: (module) => ({
        url: `${BASE}/filters`,
        method: "GET",
        params: module ? { module } : undefined,
      }),
      providesTags: [AUDIT_LOG_TAG],
    }),
  }),
});

export const { useGetAuditLogsQuery, useGetAuditLogFiltersQuery } = auditLogApi;
