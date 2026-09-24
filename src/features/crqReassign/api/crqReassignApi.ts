import { api } from "../../../service/api";
import type {
  ReassignActionResponse,
  ReassignBatchRequest,
  ReassignCabRequest,
  ReassignCandidateParams,
  ReassignCandidateRow,
  ReassignGridParams,
  ReassignGridRow,
  ReassignHistoryParams,
  ReassignHistoryRow,
  ReassignMemberRequest,
  ReassignStats,
  ReassignStatsParams,
  ReassignTimeRequest,
  ReassignTimelineParams,
  ReassignTimelineRow,
} from "../types/crqReassign.types";

// ─────────────────────────────────────────────────────────────────────────────
//  CRQ Reassignment — RTK Query endpoints
//  Backend: CrqReassignController (/crq/reassign) → CRQ_SP_REASSIGN_* procs.
//  Every write lands in a draft batch, so each one invalidates the whole
//  page (grid, timeline, candidates, stats, history) in one tag.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = "/crq/reassign";
const TAG = { type: "CrqReassign" as const, id: "ALL" as const };

/** Drops blank / "all" params so the proc receives NULL ("no filter"). */
const clean = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "all"),
  );

export const crqReassignApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReassignGrid: builder.query<ReassignGridRow[], ReassignGridParams>({
      query: (params) => ({ url: `${BASE}/grid`, method: "GET", params: clean(params) }),
      providesTags: [TAG],
    }),

    getReassignTimeline: builder.query<ReassignTimelineRow[], ReassignTimelineParams>({
      query: (params) => ({ url: `${BASE}/timeline`, method: "GET", params: clean(params) }),
      providesTags: [TAG],
    }),

    getReassignCandidates: builder.query<ReassignCandidateRow[], ReassignCandidateParams>({
      query: (params) => ({ url: `${BASE}/candidates`, method: "GET", params: clean(params) }),
      providesTags: [TAG],
    }),

    getReassignStats: builder.query<ReassignStats, ReassignStatsParams>({
      query: (params) => ({ url: `${BASE}/stats`, method: "GET", params: clean(params) }),
      providesTags: [TAG],
    }),

    getReassignHistory: builder.query<ReassignHistoryRow[], ReassignHistoryParams>({
      query: (params) => ({ url: `${BASE}/history`, method: "GET", params: clean(params) }),
      providesTags: [TAG],
    }),

    reassignMember: builder.mutation<ReassignActionResponse, ReassignMemberRequest>({
      query: (body) => ({ url: `${BASE}/member`, method: "POST", body }),
      invalidatesTags: [TAG],
    }),

    reassignTime: builder.mutation<ReassignActionResponse, ReassignTimeRequest>({
      query: (body) => ({ url: `${BASE}/time`, method: "POST", body }),
      invalidatesTags: [TAG],
    }),

    reassignCab: builder.mutation<ReassignActionResponse, ReassignCabRequest>({
      query: (body) => ({ url: `${BASE}/cab`, method: "POST", body }),
      invalidatesTags: [TAG],
    }),

    undoReassign: builder.mutation<ReassignActionResponse, ReassignBatchRequest>({
      query: (body) => ({ url: `${BASE}/undo`, method: "POST", body }),
      invalidatesTags: [TAG],
    }),

    publishReassign: builder.mutation<ReassignActionResponse, ReassignBatchRequest>({
      query: (body) => ({ url: `${BASE}/publish`, method: "POST", body }),
      invalidatesTags: [TAG],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetReassignGridQuery,
  useGetReassignTimelineQuery,
  useGetReassignCandidatesQuery,
  useGetReassignStatsQuery,
  useGetReassignHistoryQuery,
  useReassignMemberMutation,
  useReassignTimeMutation,
  useReassignCabMutation,
  useUndoReassignMutation,
  usePublishReassignMutation,
} = crqReassignApi;
