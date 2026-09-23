// import {
//   type FetchArgs,
//   type QueryReturnValue,
//   type FetchBaseQueryError,
//   type FetchBaseQueryMeta,
// } from "@reduxjs/toolkit/query/react";
// import {
//   buildAgenda,
//   buildAnalytics,
//   buildCabPlanDates,
//   buildCabQueue,
//   buildDashboard,
//   buildImplementation,
//   buildJourney,
//   buildMyCrqs,
//   MOCK_ADMIN_USERS,
//   MOCK_ASSIGN_MATRIX,
//   MOCK_ASSIGN_RULES,
//   MOCK_AUDIT_LOG,
//   MOCK_CAB_SESSIONS,
//   MOCK_CRQS,
//   MOCK_ESCALATION_MATRIX,
//   MOCK_REJECTION_REASONS,
//   MOCK_SERVICE_RULES,
//   mockDelay,
// } from "../data/cabManager.mock";
// import type {
//   AdminAnalytics,
//   AdminUser,
//   ApproveCrqPayload,
//   AssignFePayload,
//   AssignMatrixCell,
//   AssignRule,
//   AssignSpocPayload,
//   AuditEntry,
//   BlockRingPayload,
//   CabPlanDate,
//   CabQueueParams,
//   CabQueueRow,
//   CabSession,
//   CabSessionDetail,
//   Crq,
//   CrqFilters,
//   CrqJourney,
//   DashboardData,
//   EscalationRow,
//   ImplementationDetail,
//   MyCrqsResponse,
//   NewCrqPayload,
//   PlanCabPayload,
//   PlanCabResult,
//   ProceedRingPayload,
//   RejectCrqPayload,
//   RejectionReason,
//   ReschedulePayload,
//   ServiceApprovalRule,
// } from "../types/types";
// import { api } from "../../../service/api";


// // ─────────────────────────────────────────────────────────────────────────────
// //  CAB Portal — RTK Query slice
// // ─────────────────────────────────────────────────────────────────────────────

// const USE_MOCK =
//   (import.meta as { env?: Record<string, string> }).env?.VITE_CAB_USE_MOCK ===
//   "true";


// const networkOrMock = async <T>(
//   request: FetchArgs,
//   baseQuery: any, // Typed generically to accept RTK Query's injected baseQuery
//   mockProvider: () => Promise<T> | T
// ): Promise<QueryReturnValue<T, FetchBaseQueryError, FetchBaseQueryMeta>> => {
//   if (USE_MOCK) {
//     return { data: await mockProvider() };
//   }

//   const result = await baseQuery(request);

//   if ("error" in result) {
//     console.warn("Network request failed; returning error instead of mock fallback.", result.error);
//     return result as QueryReturnValue<T, FetchBaseQueryError, FetchBaseQueryMeta>;
//   }

//   return result as QueryReturnValue<T, FetchBaseQueryError, FetchBaseQueryMeta>;
// };

// // ── helpers ─────────────────────────────────────────────────────────────────
// const filterCrqs = (rows: Crq[], f: CrqFilters): Crq[] => {
//   return rows.filter((r) => {
//     if (f.domain && f.domain !== "All Domains" && r.domainName !== f.domain) return false;
//     if (f.circle && f.circle !== "All Circles" && r.circleCode !== f.circle) return false;
//     if (f.stage && f.stage !== "All Stages" && r.currentStage !== f.stage) return false;
//     if (f.status && f.status !== "All Status") {
//       if (f.status === "active" && r.currentStatus !== "pending") return false;
//       if (f.status === "rejected" && r.currentStatus !== "rejected") return false;
//       if (f.status === "delegated" && r.currentStatus !== "delegated") return false;
//       if (f.status === "escalated" && r.slaPercentage < 80) return false;
//     }
//     if (f.search && f.search !== "All Search") {
//       const q = f.search.toLowerCase();
//       if (
//         !r.crqNo.toLowerCase().includes(q) &&
//         !r.approverName.toLowerCase().includes(q)
//       )
//         return false;
//     }
//     return true;
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// //  Endpoints
// // ─────────────────────────────────────────────────────────────────────────────
// export const cabPortalApi = api.injectEndpoints({
//   endpoints: (builder) => ({
    
//     // ── DASHBOARD ─────────────────────────────────────────────────────────
//     getDashboard: builder.query<DashboardData, void>({
//       queryFn: (_arg, _api, _extraOptions, baseQuery) =>
//         networkOrMock<DashboardData>(
//           { url: "/cab/dashboard", method: "GET" },
//           baseQuery,
//           () => mockDelay(buildDashboard())
//         ),
//       providesTags: ["CabDashboard"],
//     }),

//     // ── ALL CRQs ──────────────────────────────────────────────────────────
//     getAllCrqs: builder.query<Crq[], CrqFilters | void>({
//       queryFn: async (filters, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           {
//             url: "/cab/crqs",
//             method: "GET",
//             params: (filters ?? {}) as Record<string, string>,
//           },
//           baseQuery,
//           async () =>
//             await mockDelay(filterCrqs(MOCK_CRQS, (filters ?? {}) as CrqFilters))
//         ),
//       providesTags: (result) =>
//         result
//           ? [
//               ...result.map((r) => ({ type: "CabCrq" as const, id: r.crqNo })),
//               { type: "CabCrq" as const, id: "LIST" },
//             ]
//           : [{ type: "CabCrq" as const, id: "LIST" }],
//     }),

//     getCrqById: builder.query<Crq, string>({
//       queryFn: async (id, _apiArg, _extraOptions, baseQuery) => {
//         const result = await networkOrMock(
//           { url: `/cab/crqs/${encodeURIComponent(id)}`, method: "GET" },
//           baseQuery,
//           async () => {
//             const c = MOCK_CRQS.find((r) => r.crqNo === id);
//             if (c) return await mockDelay(c);
//             throw { status: 404, data: { message: "CRQ not found" } };
//           }
//         );
//         // Defensive: some deployments return the row wrapped in a single-item
//         // array (e.g. list-endpoint shape) instead of a bare object.
//         if ("data" in result && Array.isArray(result.data)) {
//           return { ...result, data: result.data[0] };
//         }
//         return result;
//       },
//       providesTags: (_r, _e, id) => [{ type: "CabCrq" as const, id }],
//     }),

//     // ── MY CRQs ───────────────────────────────────────────────────────────
//     getMyCrqs: builder.query<MyCrqsResponse, void>({
//       queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           { url: "/cab/crqs/mine", method: "GET" },
//           baseQuery,
//           async () => await mockDelay(buildMyCrqs())
//         ),
//       providesTags: [{ type: "CabCrq", id: "MINE" }],
//     }),

//     // ── CRQ JOURNEY ───────────────────────────────────────────────────────
//     getCrqJourney: builder.query<CrqJourney, string>({
//       queryFn: async (id, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           { url: `/cab/crqs/${encodeURIComponent(id)}/journey`, method: "GET" },
//           baseQuery,
//           async () => {
//             const j = buildJourney(id);
//             if (j) return await mockDelay(j);
//             throw { status: 404, data: { message: "CRQ not found" } };
//           }
//         ),
//       providesTags: (_r, _e, id) => [
//         { type: "CabCrq" as const, id: `JOURNEY-${id}` },
//       ],
//     }),

//     // ── CAB PLANNING ──────────────────────────────────────────────────────
//     getCabQueue: builder.query<CabQueueRow[], CabQueueParams>({
//       queryFn: async ({ domainId, subDomainId }, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           { url: "/cab/planning/queue", method: "GET", params: { domainId, subDomainId } },
//           baseQuery,
//           async () => await mockDelay(buildCabQueue())
//         ),
//       providesTags: ["CabQueue"],
//     }),

//     getCabPlanDates: builder.query<CabPlanDate[], void>({
//       queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock({ url: "/cab/planning/dates", method: "GET" }, baseQuery, async () =>
//           await mockDelay(buildCabPlanDates())
//         ),
//       providesTags: ["CabQueue"],
//     }),

//     // ── CAB SESSIONS ──────────────────────────────────────────────────────
//     getCabSessions: builder.query<CabSession[], void>({
//       queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock({ url: "/cab/sessions", method: "GET" }, baseQuery, async () =>
//           await mockDelay(MOCK_CAB_SESSIONS)
//         ),
//       providesTags: (result) =>
//         result
//           ? [
//               ...result.map((s) => ({ type: "CabSession" as const, id: s.id })),
//               { type: "CabSession" as const, id: "LIST" },
//             ]
//           : [{ type: "CabSession" as const, id: "LIST" }],
//     }),

//     getCabSessionDetail: builder.query<CabSessionDetail, string>({
//       queryFn: async (id, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           { url: `/cab/sessions/${encodeURIComponent(id)}`, method: "GET" },
//           baseQuery,
//           async () => {
//             const session = MOCK_CAB_SESSIONS.find((s) => s.id === id);
//             if (session)
//               return await mockDelay({
//                 session,
//                 agenda: buildAgenda(session),
//               });
//             throw { status: 404, data: { message: "Session not found" } };
//           }
//         ),
//       providesTags: (_r, _e, id) => [{ type: "CabSession" as const, id }],
//     }),

//     // ── IMPLEMENTATION ────────────────────────────────────────────────────
// getImplementation: builder.query<ImplementationDetail, void>({
//   queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
//     networkOrMock(
//       {
//         url: "/cab/crqs/implementation",
//         method: "GET",
//       },
//       baseQuery,
//       async () => {
//         // Use any fixed dummy CRQ ID
//         const impl = buildImplementation("CRQ-2026-0418");

//         if (impl) return await mockDelay(impl);

//         throw {
//           status: 404,
//           data: { message: "Mock data not found" },
//         };
//       }
//     ),

//   providesTags: [{ type: "CabImpl", id: "MOCK" }],
// }),

//     // ── ADMIN ─────────────────────────────────────────────────────────────
//     getAdminAnalytics: builder.query<AdminAnalytics, void>({
//       queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           { url: "/cab/admin/analytics", method: "GET" },
//           baseQuery,
//           async () => await mockDelay(buildAnalytics())
//         ),
//       providesTags: ["CabAdmin"],
//     }),

//     getAssignMatrix: builder.query<AssignMatrixCell[], void>({
//       queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           { url: "/cab/admin/assign-matrix", method: "GET" },
//           baseQuery,
//           async () => await mockDelay(MOCK_ASSIGN_MATRIX)
//         ),
//       providesTags: ["CabAdmin"],
//     }),

//     getAssignRules: builder.query<AssignRule[], void>({
//       queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           { url: "/cab/admin/assign-rules", method: "GET" },
//           baseQuery,
//           async () => await mockDelay(MOCK_ASSIGN_RULES)
//         ),
//       providesTags: ["CabAdmin"],
//     }),

//     getServiceRules: builder.query<ServiceApprovalRule[], void>({
//       queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           { url: "/cab/admin/service-rules", method: "GET" },
//           baseQuery,
//           async () => await mockDelay(MOCK_SERVICE_RULES)
//         ),
//       providesTags: ["CabAdmin"],
//     }),

//     getRejectionReasons: builder.query<RejectionReason[], string | void>({
//       queryFn: async (stage, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           {
//             url: "/cab/admin/rejection-reasons",
//             method: "GET",
//             params: stage ? { stage } : {},
//           },
//           baseQuery,
//           async () => await mockDelay(MOCK_REJECTION_REASONS)
//         ),
//       providesTags: ["CabAdmin"],
//     }),

//     getEscalationMatrix: builder.query<EscalationRow[], void>({
//       queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           { url: "/cab/admin/escalation-matrix", method: "GET" },
//           baseQuery,
//           async () => await mockDelay(MOCK_ESCALATION_MATRIX)
//         ),
//       providesTags: ["CabAdmin"],
//     }),

//     getAdminUsers: builder.query<AdminUser[], void>({
//       queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock({ url: "/cab/admin/users", method: "GET" }, baseQuery, async () =>
//           await mockDelay(MOCK_ADMIN_USERS)
//         ),
//       providesTags: ["CabAdmin"],
//     }),

//     getAuditLog: builder.query<AuditEntry[], void>({
//       queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock({ url: "/cab/admin/audit", method: "GET" }, baseQuery, async () =>
//           await mockDelay(MOCK_AUDIT_LOG)
//         ),
//       providesTags: ["CabAudit"],
//     }),

//     // ── Mutations ─────────────────────────────────────────────────────────
//     planCab: builder.mutation<PlanCabResult, PlanCabPayload>({
//       queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           { url: "/cab/sessions", method: "POST", body },
//           baseQuery,
//           async () => {
//             const fake: PlanCabResult = {
//               status: "Success",
//               message: `${body.crqIds.length} CRQ(s) planned under CAB-2026-${Math.floor(Math.random() * 900 + 100)}`,
//             };
//             return await mockDelay(fake);
//           }
//         ),
//       invalidatesTags: [
//         "CabQueue",
//         { type: "CabSession", id: "LIST" },
//         "CabDashboard",
//       ],
//     }),

//     createCrq: builder.mutation<Crq, NewCrqPayload>({
//       queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           { url: "/cab/crqs", method: "POST", body },
//           baseQuery,
//           async () => {
//             const fake: Crq = {

//               crqNo: `CRQ-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
//               planId: `PLAN-2026-${Math.floor(Math.random() * 900 + 100)}`,
//               domainName: body.domain,
//               circleCode: body.circle,
//               currentStage: "VALIDATE",
//               approverName: "Auto-assigned",
//               assignStartTime: body.scheduled,
//               currentStatus: "pending",
//               slaPercentage: 100,
//               assignedToMe: false,
//               raisedBy: "You",
//             };
//             return await mockDelay(fake);
//           }
//         ),
//       invalidatesTags: [{ type: "CabCrq", id: "LIST" }, "CabDashboard"],
//     }),

//     proceedRing: builder.mutation<{ ok: boolean }, ProceedRingPayload>({
//       queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           {
//             url: `/cab/crqs/${encodeURIComponent(body.crqId)}/rings/${
//               body.ringId
//             }/proceed`,
//             method: "POST",
//           },
//           baseQuery,
//           async () => await mockDelay({ ok: true })
//         ),
//       invalidatesTags: (_r, _e, b) => [{ type: "CabImpl", id: b.crqId }],
//     }),

//     blockRing: builder.mutation<{ ok: boolean }, BlockRingPayload>({
//       queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           {
//             url: `/cab/crqs/${encodeURIComponent(body.crqId)}/rings/${
//               body.ringId
//             }/block`,
//             method: "POST",
//             body,
//           },
//           baseQuery,
//           async () => await mockDelay({ ok: true })
//         ),
//       invalidatesTags: (_r, _e, b) => [{ type: "CabImpl", id: b.crqId }],
//     }),

//     approveCrq: builder.mutation<{ ok: boolean }, ApproveCrqPayload>({
//       queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           {
//             url: `/cab/crqs/${encodeURIComponent(body.crqId)}/approve`,
//             method: "POST",
//             body,
//           },
//           baseQuery,
//           async () => await mockDelay({ ok: true })
//         ),
//       invalidatesTags: (_r, _e, b) => [
//         { type: "CabCrq", id: b.crqId },
//         { type: "CabCrq", id: "LIST" },
//         { type: "CabCrq", id: "MINE" },
//         "CabDashboard",
//       ],
//     }),

//     rejectCrq: builder.mutation<{ ok: boolean }, RejectCrqPayload>({
//       queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           {
//             url: `/cab/crqs/${encodeURIComponent(body.crqId)}/reject`,
//             method: "POST",
//             body,
//           },
//           baseQuery,
//           async () => await mockDelay({ ok: true })
//         ),
//       invalidatesTags: (_r, _e, b) => [
//         { type: "CabCrq", id: b.crqId },
//         { type: "CabCrq", id: "LIST" },
//         { type: "CabCrq", id: "MINE" },
//         "CabDashboard",
//       ],
//     }),

//     rescheduleCrq: builder.mutation<{ ok: boolean }, ReschedulePayload>({
//       queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           {
//             url: `/cab/crqs/${encodeURIComponent(body.crqId)}/reschedule`,
//             method: "POST",
//             body,
//           },
//           baseQuery,
//           async () => await mockDelay({ ok: true })
//         ),
//       invalidatesTags: (_r, _e, b) => [
//         { type: "CabCrq", id: b.crqId },
//         { type: "CabCrq", id: "LIST" },
//       ],
//     }),

//     assignSpoc: builder.mutation<{ ok: boolean }, AssignSpocPayload>({
//       queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           {
//             url: `/cab/crqs/${encodeURIComponent(body.crqId)}/assign-spoc`,
//             method: "POST",
//             body,
//           },
//           baseQuery,
//           async () => await mockDelay({ ok: true })
//         ),
//       invalidatesTags: (_r, _e, b) => [
//         { type: "CabCrq", id: b.crqId },
//         { type: "CabCrq", id: "MINE" },
//       ],
//     }),

//     assignFe: builder.mutation<{ ok: boolean }, AssignFePayload>({
//       queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
//         networkOrMock(
//           {
//             url: `/cab/crqs/${encodeURIComponent(body.crqId)}/assign-fe`,
//             method: "POST",
//             body,
//           },
//           baseQuery,
//           async () => await mockDelay({ ok: true })
//         ),
//       invalidatesTags: (_r, _e, b) => [
//         { type: "CabCrq", id: b.crqId },
//         { type: "CabCrq", id: "MINE" },
//       ],
//     }),
//   }),
//   overrideExisting: false,
// });

// // ── Auto-generated hooks ────────────────────────────────────────────────────
// export const {
//   // queries
//   useGetDashboardQuery,
//   useGetAllCrqsQuery,
//   useGetCrqByIdQuery,
//   useGetMyCrqsQuery,
//   useGetCrqJourneyQuery,
//   useGetCabQueueQuery,
//   useGetCabPlanDatesQuery,
//   useGetCabSessionsQuery,
//   useGetCabSessionDetailQuery,
//   useGetImplementationQuery,
//   useGetAdminAnalyticsQuery,
//   useGetAssignMatrixQuery,
//   useGetAssignRulesQuery,
//   useGetServiceRulesQuery,
//   useGetRejectionReasonsQuery,
//   useGetEscalationMatrixQuery,
//   useGetAdminUsersQuery,
//   useGetAuditLogQuery,
//   // mutations
//   usePlanCabMutation,
//   useCreateCrqMutation,
//   useProceedRingMutation,
//   useBlockRingMutation,
//   useApproveCrqMutation,
//   useRejectCrqMutation,
//   useRescheduleCrqMutation,
//   useAssignSpocMutation,
//   useAssignFeMutation,
// } = cabPortalApi;















import {
  type FetchArgs,
  type QueryReturnValue,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";
import {
  buildAgendaBoard,
  buildAnalytics,
  buildCabPlanDates,
  buildCabQueue,
  buildDashboard,
  buildImplementation,
  buildJourney,
  buildMyCrqs,
  MOCK_ADMIN_USERS,
  MOCK_ASSIGN_MATRIX,
  MOCK_ASSIGN_RULES,
  MOCK_AUDIT_LOG,
  MOCK_CAB_REJECT_REASONS,
  MOCK_CAB_CIRCLES,
  MOCK_CAB_SERVICES,
  MOCK_CAB_SESSIONS,
  MOCK_CRQS,
  MOCK_ESCALATION_MATRIX,
  MOCK_REJECTION_REASONS,
  MOCK_SERVICE_RULES,
  MOCK_SPOC_FE_DETAILS,
  mockDelay,
} from "../data/cabManager.mock";
import type {
  AddCrqToSessionPayload,
  AddCrqToSessionResult,
  AddServiceRulePayload,
  AdminAnalytics,
  AdminUser,
  ApproveCrqPayload,
  AssignFePayload,
  AssignMatrixCell,
  AssignRule,
  AssignSpocPayload,
  AuditEntry,
  BlockRingPayload,
  CabPageParams,
  CabPageResponse,
  CabPlanDate,
  CabQueueParams,
  CabQueueRow,
  CabRejectReason,
  CabService,
  CabAgendaRow,
  CabSession,
  CabSessionCrqActionPayload,
  CabSessionCrqActionResult,
  CircleDropdown,
  Crq,
  CrqActionResult,
  CrqConflictDecisionPayload,
  CrqConflictDetail,
  CrqFilters,
  CrqJourney,
  DashboardData,
  EscalationRow,
  ImplementationDetail,
  MyCrqDetail,
  MyCrqsResponse,
  NewCrqPayload,
  CabPlanConflict,
  PlanCabPayload,
  PlanCabResult,
  ProceedRingPayload,
  RejectCrqPayload,
  RejectionReason,
  ReschedulePayload,
  ServiceApprovalRule,
  SpocFeDetails,
} from "../types/types";
import { api } from "../../../service/api";
import { isEmptyResultError } from "../components/shared/errMsg";


// ─────────────────────────────────────────────────────────────────────────────
//  CAB Portal — RTK Query slice
// ─────────────────────────────────────────────────────────────────────────────

const USE_MOCK =
  (import.meta as { env?: Record<string, string> }).env?.VITE_CAB_USE_MOCK ===
  "true";


const networkOrMock = async <T>(
  request: FetchArgs,
  baseQuery: any, // Typed generically to accept RTK Query's injected baseQuery
  mockProvider: () => Promise<T> | T
): Promise<QueryReturnValue<T, FetchBaseQueryError, FetchBaseQueryMeta>> => {
  if (USE_MOCK) {
    return { data: await mockProvider() };
  }

  const result = await baseQuery(request);

  if ("error" in result) {
    console.warn("Network request failed; returning error instead of mock fallback.", result.error);
    return result as QueryReturnValue<T, FetchBaseQueryError, FetchBaseQueryMeta>;
  }

  return result as QueryReturnValue<T, FetchBaseQueryError, FetchBaseQueryMeta>;
};

/**
 * Collapses the procs' "no rows matched" sentinel back into an empty list.
 *
 * The CAB procedures report an empty result by selecting an `error_message`
 * column ("No CRQs Found"), which the backend turns into an HTTP 500. For a
 * list endpoint that is not a failure — it is the zero-row answer — so it is
 * normalised here, once, instead of in every screen that renders the list.
 * Genuine errors (timeouts, 4xx/5xx with a real message) pass straight through.
 */
const emptyListOnNoRows = async <T>(
  result: Promise<QueryReturnValue<T[], FetchBaseQueryError, FetchBaseQueryMeta>>
): Promise<QueryReturnValue<T[], FetchBaseQueryError, FetchBaseQueryMeta>> => {
  const settled = await result;
  if ("error" in settled && isEmptyResultError(settled.error)) {
    return { data: [] as T[] };
  }
  return settled;
};

// ── helpers ─────────────────────────────────────────────────────────────────

/**
 * Pulls the circle code out of one /cab/admin/circledropdown row. The endpoint
 * returns List<CircleDropdown>, whose single column has been named a few
 * different ways across the CAB procs (circleCode / circleName / circle /
 * name), and a plain List<String> is possible too - so the code is read from
 * whichever of those the row actually carries instead of hard-binding to one
 * property and rendering a list of blank menu items if it ever differs.
 */
const toCircleCode = (row: unknown): string => {
  if (typeof row === "string") return row.trim();
  if (!row || typeof row !== "object") return "";
  const r = row as Record<string, unknown>;
  const value = r.circleCode ?? r.circleName ?? r.circle ?? r.name ?? r.code;
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
};

/**
 * Slices a mock array into the same shape the paged endpoints return, so a
 * VITE_CAB_USE_MOCK run drives the table's pagination exactly like the server
 * does instead of handing back every row at once.
 */
const mockPage = <T>(rows: T[], page: number, size: number): CabPageResponse<T> => {
  const safeSize = size > 0 ? size : 10;
  const totalPages = Math.ceil(rows.length / safeSize);
  return {
    content: rows.slice(page * safeSize, page * safeSize + safeSize),
    pageNumber: page,
    pageSize: safeSize,
    totalElements: rows.length,
    totalPages,
    last: page + 1 >= totalPages,
  };
};

const filterCrqs = (rows: Crq[], f: CrqFilters): Crq[] => {
  return rows.filter((r) => {
    if (f.domain && f.domain !== "All Domains" && r.domainName !== f.domain) return false;
    if (f.circle && f.circle !== "All Circles" && r.circleCode !== f.circle) return false;
    if (f.stage && f.stage !== "All Stages" && r.currentStage !== f.stage) return false;
    if (f.serviceCode && f.serviceCode !== "All Services" && r.serviceCode !== f.serviceCode) return false;
    if (f.impact && f.impact !== "All Impact" && r.changeImpact !== f.impact) return false;
    if (f.search && f.search !== "All Search") {
      const q = f.search.toLowerCase();
      if (!r.crqNo.toLowerCase().includes(q)) return false;
    }
    return true;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  Endpoints
// ─────────────────────────────────────────────────────────────────────────────
export const cabPortalApi = api.injectEndpoints({
  endpoints: (builder) => ({
    
    // ── DASHBOARD ─────────────────────────────────────────────────────────
    getDashboard: builder.query<DashboardData, void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        networkOrMock<DashboardData>(
          { url: "/cab/dashboard", method: "GET" },
          baseQuery,
          () => mockDelay(buildDashboard())
        ),
      providesTags: ["CabDashboard"],
    }),

    // ── ALL CRQs ──────────────────────────────────────────────────────────
    getAllCrqs: builder.query<Crq[], CrqFilters | void>({
      queryFn: async (filters, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: "/cab/crqs",
            method: "GET",
            params: (filters ?? {}) as Record<string, string>,
          },
          baseQuery,
          async () =>
            await mockDelay(filterCrqs(MOCK_CRQS, (filters ?? {}) as CrqFilters))
        ),
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: "CabCrq" as const, id: r.crqNo })),
              { type: "CabCrq" as const, id: "LIST" },
            ]
          : [{ type: "CabCrq" as const, id: "LIST" }],
    }),

    getCrqById: builder.query<Crq, number>({
      queryFn: async (serviceApprovalId, _apiArg, _extraOptions, baseQuery) => {
        const result = await networkOrMock(
          { url: `/cab/crqs/${serviceApprovalId}`, method: "GET" },
          baseQuery,
          async () => {
            const c = MOCK_CRQS.find(
              (r) => r.serviceApprovalId === serviceApprovalId
            );
            if (c) return await mockDelay(c);
            throw { status: 404, data: { message: "CRQ not found" } };
          }
        );
        // Defensive: some deployments return the row wrapped in a single-item
        // array (e.g. list-endpoint shape) instead of a bare object.
        if ("data" in result && Array.isArray(result.data)) {
          return { ...result, data: result.data[0] };
        }
        return result;
      },
            providesTags: (_r, _e, serviceApprovalId) => [
        { type: "CabCrq" as const, id: serviceApprovalId },
      ],
    }),

    // ── MY CRQs ───────────────────────────────────────────────────────────
    getMyCrqs: builder.query<MyCrqsResponse, void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/crqs/mine", method: "GET" },
          baseQuery,
          async () => await mockDelay(buildMyCrqs())
        ),
      providesTags: [{ type: "CabCrq", id: "MINE" }],
    }),

    /**
     * Keyed on Service_Approval_Id (the `serviceApprovalId` on the My CRQs list
     * row), not the CRQ number: sp_get_cab_my_crq_by_id now looks the row up by
     * CRQ_CAB_SERVICE_TBL.Id, so a CRQ with more than one service-approval row
     * resolves to the exact one that was clicked.
     */
    getMyCrqById: builder.query<MyCrqDetail, number>({
      queryFn: async (serviceApprovalId, _apiArg, _extraOptions, baseQuery) => {
        const result = await networkOrMock(
          { url: `/cab/crqs/mine/${serviceApprovalId}`, method: "GET" },
          baseQuery,
          async () => {
            const c = MOCK_CRQS.find(
              (r) => r.serviceApprovalId === serviceApprovalId
            );
            if (c) return await mockDelay(c as MyCrqDetail);
            throw { status: 404, data: { message: "CRQ not found" } };
          }
        );
        // Defensive: some deployments return the row wrapped in a single-item
        // array (e.g. list-endpoint shape) instead of a bare object.
        if ("data" in result && Array.isArray(result.data)) {
          return { ...result, data: result.data[0] };
        }
        return result;
      },
      providesTags: (_r, _e, serviceApprovalId) => [
        { type: "CabCrq" as const, id: `MINE-${serviceApprovalId}` },
      ],
    }),

    // ── CRQ JOURNEY ───────────────────────────────────────────────────────
    getCrqJourney: builder.query<CrqJourney, string>({
      queryFn: async (id, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: `/cab/crqs/${encodeURIComponent(id)}/journey`, method: "GET" },
          baseQuery,
          async () => {
            const j = buildJourney(id);
            if (j) return await mockDelay(j);
            throw { status: 404, data: { message: "CRQ not found" } };
          }
        ),
      providesTags: (_r, _e, id) => [
        { type: "CabCrq" as const, id: `JOURNEY-${id}` },
      ],
    }),

    // ── CAB PLANNING ──────────────────────────────────────────────────────
    getCabQueue: builder.query<CabQueueRow[], CabQueueParams>({
      queryFn: async ({ domainId, subDomainId }, _apiArg, _extraOptions, baseQuery) =>
        emptyListOnNoRows(
          networkOrMock(
            { url: "/cab/planning/queue", method: "GET", params: { domainId, subDomainId } },
            baseQuery,
            async () => await mockDelay(buildCabQueue())
          )
        ),
      // Scoped per domain/sub-domain so switching scope can never serve another
      // scope's cached rows, and so invalidating the queue refetches only what
      // is actually mounted.
      providesTags: (_r, _e, { domainId, subDomainId }) => [
        "CabQueue",
        { type: "CabQueue" as const, id: `${domainId}-${subDomainId}` },
      ],
    }),

    getCabPlanDates: builder.query<CabPlanDate[], void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        emptyListOnNoRows(
          networkOrMock({ url: "/cab/planning/dates", method: "GET" }, baseQuery, async () =>
            await mockDelay(buildCabPlanDates())
          )
        ),
      providesTags: ["CabQueue"],
    }),

    // ── CAB SESSIONS ──────────────────────────────────────────────────────
    getCabSessions: builder.query<CabSession[], void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock({ url: "/cab/sessions", method: "GET" }, baseQuery, async () =>
          await mockDelay(MOCK_CAB_SESSIONS)
        ),
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: "CabSession" as const, id: s.id })),
              { type: "CabSession" as const, id: "LIST" },
            ]
          : [{ type: "CabSession" as const, id: "LIST" }],
    }),

    // The agenda board for one session — the CRQs tabled at it and the decision
    // standing against each. A session with nothing tabled yet answers with the
    // procs' "no rows" sentinel, which is an empty agenda, not a failure.
    getCabSessionAgenda: builder.query<CabAgendaRow[], string>({
      queryFn: async (id, _apiArg, _extraOptions, baseQuery) =>
        emptyListOnNoRows(
          networkOrMock(
            { url: `/cab/sessions/${encodeURIComponent(id)}/agenda`, method: "GET" },
            baseQuery,
            async () => await mockDelay(buildAgendaBoard(id))
          )
        ),
      providesTags: (_r, _e, id) => [
        { type: "CabSession" as const, id: `AGENDA-${id}` },
      ],
    }),

    // ── IMPLEMENTATION ────────────────────────────────────────────────────
getImplementation: builder.query<ImplementationDetail, void>({
  queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
    networkOrMock(
      {
        url: "/cab/crqs/implementation",
        method: "GET",
      },
      baseQuery,
      async () => {
        // Use any fixed dummy CRQ ID
        const impl = buildImplementation("CRQ-2026-0418");

        if (impl) return await mockDelay(impl);

        throw {
          status: 404,
          data: { message: "Mock data not found" },
        };
      }
    ),

  providesTags: [{ type: "CabImpl", id: "MOCK" }],
}),

    // ── ADMIN ─────────────────────────────────────────────────────────────
    getAdminAnalytics: builder.query<AdminAnalytics, void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/admin/analytics", method: "GET" },
          baseQuery,
          async () => await mockDelay(buildAnalytics())
        ),
      providesTags: ["CabAdmin"],
    }),

    getAssignMatrix: builder.query<AssignMatrixCell[], void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/admin/assign-matrix", method: "GET" },
          baseQuery,
          async () => await mockDelay(MOCK_ASSIGN_MATRIX)
        ),
      providesTags: ["CabAdmin"],
    }),

    getAssignRules: builder.query<AssignRule[], void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/admin/assign-rules", method: "GET" },
          baseQuery,
          async () => await mockDelay(MOCK_ASSIGN_RULES)
        ),
      providesTags: ["CabAdmin"],
    }),

    // Server-paged (Spring Pageable): page is 0-based, matching MRT's pageIndex.
    getServiceRules: builder.query<CabPageResponse<ServiceApprovalRule>, CabPageParams | void>({
      queryFn: async (args, _apiArg, _extraOptions, baseQuery) => {
        const page = args?.page ?? 0;
        const size = args?.size ?? 10;
        return networkOrMock(
          { url: "/cab/admin/service-rules", method: "GET", params: { page, size } },
          baseQuery,
          async () => await mockDelay(mockPage(MOCK_SERVICE_RULES, page, size))
        );
      },
      providesTags: ["CabAdmin"],
    }),

    addServiceRule: builder.mutation<CrqActionResult, AddServiceRulePayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: "/cab/admin/add/service-rules",
            method: "POST",
            body,
          },
          baseQuery,
          async () => await mockDelay({ status: "Success", message: `Service escalation added for ${body.service} / ${body.circle}.` })
        ),
      invalidatesTags: ["CabAdmin"],
    }),

    getRejectionReasons: builder.query<RejectionReason[], string | void>({
      queryFn: async (stage, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: "/cab/admin/rejection-reasons",
            method: "GET",
            params: stage ? { stage } : {},
          },
          baseQuery,
          async () => await mockDelay(MOCK_REJECTION_REASONS)
        ),
      providesTags: ["CabAdmin"],
    }),

    getEscalationMatrix: builder.query<EscalationRow[], void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/admin/escalation-matrix", method: "GET" },
          baseQuery,
          async () => await mockDelay(MOCK_ESCALATION_MATRIX)
        ),
      providesTags: ["CabAdmin"],
    }),

    // ── AllCRQs reject dropdown (mirrors sp_get_cab_reject_reasons) ────────
    getCabRejectReasons: builder.query<CabRejectReason[], void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/crqs/cabrejectreasons", method: "GET" },
          baseQuery,
          async () => await mockDelay(MOCK_CAB_REJECT_REASONS)
        ),
      providesTags: ["CabAdmin", "CabRejectReasons"],
    }),

    addCabRejectReason: builder.mutation<CrqActionResult, { reasonText: string }>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/crqs/cabrejectreasons", method: "POST", body },
          baseQuery,
          async () => await mockDelay({ status: "Success", message: "Rejection reason added successfully." })
        ),
      invalidatesTags: ["CabAdmin", "CabRejectReasons"],
    }),

    updateCabRejectReason: builder.mutation<CrqActionResult, { reasonId: number; reasonText: string }>({
      queryFn: async ({ reasonId, reasonText }, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: `/cab/crqs/cabrejectreasons/${reasonId}`, method: "PUT", body: { reasonText } },
          baseQuery,
          async () => await mockDelay({ status: "Success", message: "Rejection reason updated successfully." })
        ),
      invalidatesTags: ["CabAdmin", "CabRejectReasons"],
    }),

    deleteCabRejectReason: builder.mutation<CrqActionResult, number>({
      queryFn: async (reasonId, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: `/cab/crqs/cabrejectreasons/${reasonId}`, method: "DELETE" },
          baseQuery,
          async () => await mockDelay({ status: "Success", message: "Rejection reason deleted successfully." })
        ),
      invalidatesTags: ["CabAdmin", "CabRejectReasons"],
    }),

    // ── AllCRQs "Service" filter (mirrors CRQ_CAB_SERVICE_MASTER) ──────────
    getCabServices: builder.query<CabService[], void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/crqs/services", method: "GET" },
          baseQuery,
          async () => await mockDelay(MOCK_CAB_SERVICES)
        ),
      providesTags: ["CabAdmin"],
    }),

    // ── Admin "Add Service Approval" modal — Service Type dropdown
    //    (sp_get_services_dropdown, same { serviceCode } shape as CabService) ──
    getServicesDropdown: builder.query<CabService[], void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/admin/servicesdropdown", method: "GET" },
          baseQuery,
          async () => await mockDelay(MOCK_CAB_SERVICES)
        ),
      providesTags: ["CabAdmin"],
    }),

    // ── Admin "Add Service Approval" modal — Circle dropdown ──
    //    GET /cab/admin/circledropdown -> List<CircleDropdown>.
    //    Rows are normalised to { circleCode } here rather than via
    //    transformResponse, which RTK Query does not apply to queryFn
    //    endpoints (see toCircleCode).
    getCircleDropdown: builder.query<CircleDropdown[], void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) => {
        const result = await networkOrMock<unknown[]>(
          { url: "/cab/admin/circledropdown", method: "GET" },
          baseQuery,
          async () => await mockDelay(MOCK_CAB_CIRCLES)
        );
        if (result.error) return { error: result.error, meta: result.meta };
        const rows = Array.isArray(result.data) ? result.data : [];
        return {
          data: rows
            .map((row) => ({ circleCode: toCircleCode(row) }))
            .filter((c) => !!c.circleCode),
          meta: result.meta,
        };
      },
      providesTags: ["CabAdmin"],
    }),

    getAdminUsers: builder.query<AdminUser[], void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock({ url: "/cab/admin/users", method: "GET" }, baseQuery, async () =>
          await mockDelay(MOCK_ADMIN_USERS)
        ),
      providesTags: ["CabAdmin"],
    }),

    getAuditLog: builder.query<AuditEntry[], void>({
      queryFn: async (_arg, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock({ url: "/cab/admin/audit", method: "GET" }, baseQuery, async () =>
          await mockDelay(MOCK_AUDIT_LOG)
        ),
      providesTags: ["CabAudit"],
    }),

    // Is this date + time already taken by a CAB session? Asked before the
    // session is planned so its CRQs can be added to the one already there,
    // on the same link, rather than a second session landing in the slot.
    getCabPlanConflict: builder.query<CabPlanConflict, { date: string; time: string }>({
      queryFn: async ({ date, time }, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/sessions/conflict", method: "GET", params: { date, time } },
          baseQuery,
          async () =>
            await mockDelay<CabPlanConflict>({
              conflict: false,
              cabId: null,
              sessionLink: null,
              crqList: [],
            })
        ),
      providesTags: [{ type: "CabSession", id: "PLAN_CONFLICT" }],
    }),

    // ── Mutations ─────────────────────────────────────────────────────────
    planCab: builder.mutation<PlanCabResult, PlanCabPayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/sessions", method: "POST", body },
          baseQuery,
          async () => {
            const fake: PlanCabResult = {
              status: "Success",
              message: `${body.crqIds.length} CRQ(s) planned under CAB-2026-${Math.floor(Math.random() * 900 + 100)}`,
            };
            return await mockDelay(fake);
          }
        ),
      invalidatesTags: [
        "CabQueue",
        { type: "CabSession", id: "LIST" },
        // The slot this just filled - a re-check must not answer from the
        // pre-plan cache, or the modal would offer to create a second session.
        { type: "CabSession", id: "PLAN_CONFLICT" },
        "CabDashboard",
      ],
    }),

    // Records APPROVE / REJECT / RESCHEDULE against one CRQ on a session's
    // agenda. Addressed by mappingId, not CRQ number — the same CRQ can be
    // tabled again later and each sitting keeps its own decision.
    recordCabSessionCrqDecision: builder.mutation<
      CabSessionCrqActionResult,
      CabSessionCrqActionPayload
    >({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: `/cab/sessions/agenda/${body.mappingId}/action`,
            method: "POST",
            body: { action: body.action, reason: body.reason, comment: body.comment },
          },
          baseQuery,
          async () =>
            await mockDelay<CabSessionCrqActionResult>({
              mappingId: body.mappingId,
              cabId: body.sessionId,
              crqNo: `CRQ-MOCK-${body.mappingId}`,
              previousStatus: "PENDING",
              newStatus:
                body.action === "APPROVE"
                  ? "APPROVED"
                  : body.action === "REJECT"
                    ? "REJECTED"
                    : "RESCHEDULED",
            })
        ),
      invalidatesTags: (_r, _e, b) => [
        { type: "CabSession" as const, id: `AGENDA-${b.sessionId}` },
        { type: "CabSession" as const, id: b.sessionId },
        // A decision moves the CRQ on, so the planning queue and the dashboard
        // counts drawn before it are stale.
        "CabQueue",
        "CabDashboard",
      ],
    }),

    // Pulls further CRQs onto an agenda that is already open. CRQs the session
    // already carries come back under skippedCrqList — a partial add is a
    // normal outcome, so the caller reports both halves.
    addCrqsToCabSession: builder.mutation<AddCrqToSessionResult, AddCrqToSessionPayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: `/cab/sessions/${encodeURIComponent(body.sessionId)}/crqs`,
            method: "POST",
            body: { crqIds: body.crqIds },
          },
          baseQuery,
          async () =>
            await mockDelay<AddCrqToSessionResult>({
              cabId: body.sessionId,
              addedCount: body.crqIds.length,
              skippedCount: 0,
              addedCrqList: body.crqIds,
              skippedCrqList: [],
            })
        ),
      invalidatesTags: (_r, _e, b) => [
        { type: "CabSession" as const, id: `AGENDA-${b.sessionId}` },
        { type: "CabSession" as const, id: b.sessionId },
        { type: "CabSession" as const, id: "LIST" },
        "CabQueue",
      ],
    }),

    createCrq: builder.mutation<Crq, NewCrqPayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: "/cab/crqs", method: "POST", body },
          baseQuery,
          async () => {
            const fake: Crq = {
              serviceApprovalId: Math.floor(Math.random() * 9000 + 1000),
              crqNo: `CRQ-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
              planId: `PLAN-2026-${Math.floor(Math.random() * 900 + 100)}`,
              domainName: body.domain,
              circleCode: body.circle,
              currentStage: "VALIDATE",
              serviceCode: "",
              stageStatus: "",
              serviceApprovalStatus: "PENDING",
              slaPercentage: 100,
            };
            return await mockDelay(fake);
          }
        ),
      invalidatesTags: [{ type: "CabCrq", id: "LIST" }, "CabDashboard"],
    }),

    proceedRing: builder.mutation<{ ok: boolean }, ProceedRingPayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: `/cab/crqs/${encodeURIComponent(body.crqId)}/rings/${
              body.ringId
            }/proceed`,
            method: "POST",
          },
          baseQuery,
          async () => await mockDelay({ ok: true })
        ),
      invalidatesTags: (_r, _e, b) => [{ type: "CabImpl", id: b.crqId }],
    }),

    blockRing: builder.mutation<{ ok: boolean }, BlockRingPayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: `/cab/crqs/${encodeURIComponent(body.crqId)}/rings/${
              body.ringId
            }/block`,
            method: "POST",
            body,
          },
          baseQuery,
          async () => await mockDelay({ ok: true })
        ),
      invalidatesTags: (_r, _e, b) => [{ type: "CabImpl", id: b.crqId }],
    }),

    approveCrq: builder.mutation<CrqActionResult, ApproveCrqPayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
           url: `/cab/crqs/${body.serviceApprovalId}/approve`,
            method: "POST",
            body,
          },
          baseQuery,
          async () => await mockDelay({ status: "Success", message: "CRQ approved successfully." })
        ),
        invalidatesTags: (_r, _e, b) => [
        { type: "CabCrq", id: b.serviceApprovalId },
        { type: "CabCrq", id: "LIST" },
        { type: "CabCrq", id: "MINE" },
        "CabDashboard",
        // The CRQ Journey Explorer caches under CrqReview, not CabCrq — without
        // this it keeps serving the pre-approval stages/details for this CRQ,
        // both on a direct search and via the drawer's "View full CRQ journey".
        // Bare type = every CrqReview entry, which is what the scheduler-side
        // stage mutations already do; the payload has no crqNo to narrow it to.
        "CrqReview",
      ],
    }),

    rejectCrq: builder.mutation<CrqActionResult, RejectCrqPayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: `/cab/crqs/${body.serviceApprovalId}/reject`,
            method: "POST",
            body,
          },
          baseQuery,
          async () => await mockDelay({ status: "Success", message: "CRQ rejected successfully." })
        ),
      invalidatesTags: (_r, _e, b) => [
        { type: "CabCrq", id: b.serviceApprovalId },
        { type: "CabCrq", id: "LIST" },
        { type: "CabCrq", id: "MINE" },
        "CabDashboard",
        "CrqReview",
      ],
    }),

    rescheduleCrq: builder.mutation<CrqActionResult, ReschedulePayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: `/cab/crqs/${body.serviceApprovalId}/reschedule`,
            method: "POST",
            body,
          },
          baseQuery,
          async () => await mockDelay({ status: "Success", message: "CRQ rescheduled successfully." })
        ),
      invalidatesTags: (_r, _e, b) => [
        { type: "CabCrq", id: b.serviceApprovalId },
        { type: "CabCrq", id: "LIST" },
        "CrqReview",
      ],
    }),

    assignSpoc: builder.mutation<CrqActionResult, AssignSpocPayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: `/cab/crqs/${encodeURIComponent(body.crqId)}/assign-spoc`,
            method: "POST",
            params: { spocOlmId: body.spocOlmId },
          },
          baseQuery,
          async () => await mockDelay({ status: "Success", message: "SPOC assigned successfully." })
        ),
      invalidatesTags: (_r, _e, b) => [
        { type: "CabCrq", id: b.crqId },
        { type: "CabCrq", id: "MINE" },
        // Assignment writes CRQ_STAGE_ASSIGN_TBL, which is where the journey's
        // stage timeline (and "Entered Stage At") is read from.
        "CrqReview",
      ],
    }),

    assignFe: builder.mutation<CrqActionResult, AssignFePayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: `/cab/crqs/${encodeURIComponent(body.crqId)}/assign-fe`,
            method: "POST",
            params: { fieldEngineerOlmId: body.fieldEngineerOlmId },
          },
          baseQuery,
          async () => await mockDelay({ status: "Success", message: "Field Engineer assigned successfully." })
        ),
      invalidatesTags: (_r, _e, b) => [
        { type: "CabCrq", id: b.crqId },
        { type: "CabCrq", id: "MINE" },
        // Assignment writes CRQ_STAGE_ASSIGN_TBL, which is where the journey's
        // stage timeline (and "Entered Stage At") is read from.
        "CrqReview",
      ],
    }),

    // ── SPOC / FIELD ENGINEER DETAILS ─────────────────────────────────────
    // GET /cab/crqs/{crqNo}/spoc-fe-details -> sp_get_SPOC_FE_details(crqNo).
    // The proc returns at most one row; `null` here means "no assignment row
    // for this CRQ", which the dialog renders as an empty state rather than an
    // error. A single-object body and a one-element array body are both
    // accepted, the same defensive unwrap getCrqById/getMyCrqById already do.
    getSpocFeDetails: builder.query<SpocFeDetails | null, string>({
      queryFn: async (crqNo, _apiArg, _extraOptions, baseQuery) => {
        const result = await networkOrMock<SpocFeDetails | SpocFeDetails[] | null>(
          {
            url: `/cab/crqs/${encodeURIComponent(crqNo)}/spoc-fe-details`,
            method: "GET",
          },
          baseQuery,
          async () => await mockDelay(MOCK_SPOC_FE_DETAILS(crqNo))
        );
        if (result.error) return { error: result.error, meta: result.meta };
        const row = Array.isArray(result.data) ? (result.data[0] ?? null) : (result.data ?? null);
        return { data: row, meta: result.meta };
      },
      providesTags: (_r, _e, crqNo) => [{ type: "CabCrq" as const, id: `SPOCFE-${crqNo}` }],
    }),

    // ── SERVICE IMPACT EXPORT ─────────────────────────────────────────────
    // GET /cab/crqs/service-csv/export - runs getCSVasperService.py for this
    // CRQ + service on the SSH host and streams back the .xlsx built from its
    // stdout. Not cached (no providesTags): it re-runs the script every time,
    // which is the point - the caller wants today's rows, not a replay.
    downloadServiceCsvExcel: builder.query<Blob, { crqNo: string; service: string }>({
      query: ({ crqNo, service }) => ({
        url: "/cab/crqs/service-csv/export",
        method: "GET",
        params: { crqNo, service },
        responseHandler: (response: Response) => response.blob(),
        cache: "no-cache",
      }),
    }),

    // ── CONFLICT CHECK ────────────────────────────────────────────────────
    getCrqConflicts: builder.query<CrqConflictDetail[], string>({
      queryFn: async (crqNo, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          { url: `/cab/crqs/${encodeURIComponent(crqNo)}/conflicts`, method: "GET" },
          baseQuery,
          async () => await mockDelay([])
        ),
      providesTags: (_r, _e, crqNo) => [{ type: "CabCrq" as const, id: `CONFLICTS-${crqNo}` }],
    }),

    submitCrqConflictDecision: builder.mutation<CrqActionResult, CrqConflictDecisionPayload>({
      queryFn: async (body, _apiArg, _extraOptions, baseQuery) =>
        networkOrMock(
          {
            url: `/cab/crqs/${encodeURIComponent(body.crqNo)}/conflicts/decision`,
            method: "POST",
            body: { flag: body.flag },
          },
          baseQuery,
          async () => await mockDelay({ status: "Success", message: `Conflict decision "${body.flag}" recorded.` })
        ),
      invalidatesTags: (_r, _e, b) => [
        { type: "CabCrq" as const, id: `CONFLICTS-${b.crqNo}` },
        // Flips the journey canvas's CONFLICT CHECK node. This payload does
        // carry the crqNo, so only that CRQ's journey needs dropping.
        { type: "CrqReview" as const, id: `JOURNEY-STAGES-${b.crqNo}` },
        { type: "CrqReview" as const, id: `JOURNEY-DETAILS-${b.crqNo}` },
      ],
    }),
  }),
  overrideExisting: false,
});

// ── Auto-generated hooks ────────────────────────────────────────────────────
export const {
  // queries
  useGetDashboardQuery,
  useGetAllCrqsQuery,
  useGetCrqByIdQuery,
  useGetMyCrqsQuery,
  useGetMyCrqByIdQuery,
  useGetCrqJourneyQuery,
  useGetCabQueueQuery,
  useGetCabPlanDatesQuery,
  useGetCabSessionsQuery,
  useGetCabSessionAgendaQuery,
  useGetImplementationQuery,
  useGetAdminAnalyticsQuery,
  useGetAssignMatrixQuery,
  useGetAssignRulesQuery,
  useGetServiceRulesQuery,
  useGetRejectionReasonsQuery,
  useGetCabRejectReasonsQuery,
  useGetCabServicesQuery,
  useGetServicesDropdownQuery,
  useGetCircleDropdownQuery,
  useGetEscalationMatrixQuery,
  useGetAdminUsersQuery,
  useGetAuditLogQuery,
  useGetCrqConflictsQuery,
  useGetSpocFeDetailsQuery,
  useLazyDownloadServiceCsvExcelQuery,
  // mutations
  useGetCabPlanConflictQuery,
  usePlanCabMutation,
  useRecordCabSessionCrqDecisionMutation,
  useAddCrqsToCabSessionMutation,
  useCreateCrqMutation,
  useProceedRingMutation,
  useBlockRingMutation,
  useApproveCrqMutation,
  useRejectCrqMutation,
  useRescheduleCrqMutation,
  useAssignSpocMutation,
  useAssignFeMutation,
  useAddServiceRuleMutation,
  useAddCabRejectReasonMutation,
  useUpdateCabRejectReasonMutation,
  useDeleteCabRejectReasonMutation,
  useSubmitCrqConflictDecisionMutation,
} = cabPortalApi;