import { api } from "../../../service/api";
import type { CrqReviewResponse, Plan } from "../types/crqWorkflow.types";

/** Mirrors backend common/dto/PageResponseDto.java. */
export interface CrqWorkflowOverviewPage {
  content: Plan[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/**
 * Every endpoint here takes `domainId?: number | null`. `null` means the
 * caller's role has no domain scope (TEAM_MEMBER/TEAM_LEAD): the param is
 * then omitted from the request rather than sent as a made-up value, and the
 * backend scopes the caller by their own assignments instead. See
 * util/orgScope.ts for how a screen arrives at that null.
 */
export const rosterApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    getCrqReview: builder.query<
      CrqReviewResponse,
      {
        domainId?: number | null;
        subDomainId: number;
      }
    >({
      query: ({ domainId, subDomainId }) => ({
        url: "/crqworkflow/crqreview",
        method: "GET",
        params: {
          domainId: domainId ?? undefined,
          subDomainId,
        },
      }),
      providesTags: ["CrqReview"],
    }),

    // GET /crqworkflow/overview - every CRQ regardless of stage, with full
    // per-stage history[]. Backs the "View Selected CRQ" cockpit.
    getCrqWorkflowOverview: builder.query<
      CrqReviewResponse,
      {
        domainId?: number | null;
        subDomainId: number;
      }
    >({
      query: ({ domainId, subDomainId }) => ({
        url: "/crqworkflow/overview",
        method: "GET",
        params: {
          domainId: domainId ?? undefined,
          subDomainId,
        },
      }),
      providesTags: ["CrqReview"],
    }),

    // GET /crqworkflow/overview/paged - paginated/searchable sibling of
    // /overview, used by CrqWorkflowSidebar's CRQ list so a scope with
    // 1000+ CRQs is never fetched all at once. Plan grouping is preserved
    // within each page (content = this page's plans, containing only the
    // CRQs that fell in the LIMIT/OFFSET window).
    getCrqWorkflowOverviewPaged: builder.query<
      CrqWorkflowOverviewPage,
      {
        domainId?: number | null;
        subDomainId: number;
        search?: string;
        page: number;
        size: number;
      }
    >({
      query: ({ domainId, subDomainId, search, page, size }) => ({
        url: "/crqworkflow/overview/paged",
        method: "GET",
        params: {
          domainId: domainId ?? undefined,
          subDomainId,
          search: search ?? "",
          page,
          size,
        },
      }),
      providesTags: ["CrqReview"],
    }),

    // GET /crqworkflow/overview/{crqNo} - hydrates the cockpit's main panel
    // (header/rail/summary/history) for exactly one CRQ, independent of
    // whichever page of the paged list is currently showing. RTK Query
    // caches per crqNo, so re-selecting an already-fetched CRQ is free.
    getCrqWorkflowOverviewByCrqNo: builder.query<
      CrqReviewResponse,
      {
        domainId?: number | null;
        subDomainId: number;
        crqNo: string;
      }
    >({
      query: ({ domainId, subDomainId, crqNo }) => ({
        url: `/crqworkflow/overview/${crqNo}`,
        method: "GET",
        params: { domainId: domainId ?? undefined, subDomainId },
      }),
      providesTags: ["CrqReview"],
    }),

    // GET /crqworkflow/{crqNo}/plan-pdf - "Preview CRQ". Backend calls the
    // existing Get_Change_PlanPDF stored procedure and streams back a real
    // application/pdf response (404 JSON if no document is stored).
    getCrqPlanPdf: builder.query<Blob, string>({
      query: (crqNo) => ({
        url: `/crqworkflow/${crqNo}/plan-pdf`,
        method: "GET",
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
    }),

    // POST /crqworkflow/updatecrqreview/start|pause?crqNo=&crqId=
    updateCrqReviewStatus: builder.mutation<
      { message?: string },
      {
        crqNo: string;
        crqId: number | string;
        action: "start" | "pause";
      }
    >({
      query: ({ crqNo, crqId, action }) => ({
        url: `/crqworkflow/updatecrqreview/${action}`,
        method: "POST",
        params: {
          crqNo,
          crqId,
        },
      }),
      invalidatesTags: ["CrqReview"],
    }),

    // POST /crqworkflow/updatecrqreview/done - completes (or fails) the
    // Plan & Inventory review; on "DONE" the backend advances the CRQ to
    // Impact Analysis in a single transaction.
    // Backend controller requires olmId/crqNo/crqId/localStatus/remark/
    // planNumber/taskNumber (all mandatory @RequestParam), plus optional
    // cygnetStatus/field1/field3/field4/field5 for the cancellation flow.
    submitCrqReviewDone: builder.mutation<
      { message?: string },
      {
        crqNo: string;
        crqId: number | string;
        olmId: string;
        localStatus: string;
        remark?: string;
        planNumber: string;
        taskNumber: string;
        cygnetStatus?: string;
        field1?: string;
        field3?: string;
        field4?: string;
        field5?: string;
      }
    >({
      query: ({
        crqNo,
        crqId,
        olmId,
        localStatus,
        remark,
        planNumber,
        taskNumber,
        cygnetStatus,
        field1,
        field3,
        field4,
        field5,
      }) => ({
        url: "/crqworkflow/updatecrqreview/done",
        method: "POST",
        params: {
          crqNo,
          crqId,
          olmId,
          localStatus,
          remark: remark ?? "",
          planNumber,
          taskNumber,
          cygnetStatus,
          field1,
          field3,
          field4,
          field5,
        },
      }),
      invalidatesTags: ["CrqReview", { type: "StageWorkflow", id: "impactanalysis" }],
    }),
  }),
});

export const {
  useGetCrqReviewQuery,
  useGetCrqWorkflowOverviewQuery,
  useGetCrqWorkflowOverviewPagedQuery,
  useGetCrqWorkflowOverviewByCrqNoQuery,
  useLazyGetCrqPlanPdfQuery,
  useUpdateCrqReviewStatusMutation,
  useSubmitCrqReviewDoneMutation,
} = rosterApiSlice;
