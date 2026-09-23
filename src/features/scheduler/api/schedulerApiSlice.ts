import { api } from "../../../service/api";
import type { CrqReviewResponse } from "../types/crqWorkflow.types";

// use this api:/crqworkflow/impactanalysis?domainId=1&subDomainId=1
export const rosterApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    getImpactAnalysis: builder.query<
      CrqReviewResponse,
      {
        domainId: number;
        subDomainId: number;
      }
    >({
      query: ({ domainId, subDomainId }) => ({
        url: "/crqworkflow/impactanalysis",
        method: "GET",
        params: {
          domainId,
          subDomainId,
        },
      }),
      providesTags: ["ImpactAnalysis"],
    }),
    getCurrentShiftCount: builder.query<number, void>({
      query: () => ({
        url: "/shift/count",
        method: "GET",
      }),
    }),
    updateImpactAnalysisStatus: builder.mutation<
      any,
      {
        crqNo: string;
        crqId: number;
        action: "pause" | "start";
      }
    >({
      query: ({ crqNo, crqId, action }) => ({
        url: `/crqworkflow/updateimpactanalysis/${action}`,
        method: "POST",
        params: {
          crqNo,
          crqId,
        },
      }),
      invalidatesTags: ["ImpactAnalysis"],
    }),
  }),
});

export const {
  useGetImpactAnalysisQuery,
  useGetCurrentShiftCountQuery,
  useUpdateImpactAnalysisStatusMutation,
} = rosterApiSlice;