import { api } from "../../../service/api";
import type { HistoryEntry, QueryResult } from "../types/dataAgent.types";

export interface ApiMessageResponse {
  status: string;
  message: string;
}

export interface FeedbackRequest {
  requestId: string;
  panelId: string;
  /** 1-5, matching the Traffic QA server's /feedback contract. */
  rating: number;
  comment?: string;
}

export interface SaveHistoryRequest {
  question: string;
  summary?: string | null;
  intent?: string | null;
  rowCount?: number | null;
}

const historyListTags = (result?: HistoryEntry[]) =>
  result
    ? [
        ...result.map((h) => ({ type: "DataAgentHistory" as const, id: h.id })),
        { type: "DataAgentHistory" as const, id: "LIST" },
      ]
    : [{ type: "DataAgentHistory" as const, id: "LIST" }];

export const dataAgentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    askQuestion: builder.mutation<QueryResult, { question: string }>({
      query: ({ question }) => ({
        url: "/dataagent/ask",
        method: "POST",
        body: { question },
      }),
    }),

    submitFeedback: builder.mutation<Record<string, unknown>, FeedbackRequest>({
      query: ({ requestId, panelId, rating, comment }) => ({
        url: "/dataagent/feedback",
        method: "POST",
        body: {
          request_id: requestId,
          panel_id: panelId,
          rating,
          comment: comment ?? "",
        },
      }),
    }),

    getHistory: builder.query<HistoryEntry[], void>({
      query: () => "/dataagent/history",
      providesTags: historyListTags,
    }),

    saveHistory: builder.mutation<ApiMessageResponse, SaveHistoryRequest>({
      query: (body) => ({
        url: "/dataagent/history",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DataAgentHistory", id: "LIST" }],
    }),

    deleteHistoryEntry: builder.mutation<ApiMessageResponse, number>({
      query: (historyId) => ({
        url: `/dataagent/history/${historyId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "DataAgentHistory", id: "LIST" }],
    }),

    clearHistory: builder.mutation<ApiMessageResponse, void>({
      query: () => ({
        url: "/dataagent/history",
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "DataAgentHistory", id: "LIST" }],
    }),
  }),
});

export const {
  useAskQuestionMutation,
  useSubmitFeedbackMutation,
  useGetHistoryQuery,
  useSaveHistoryMutation,
  useDeleteHistoryEntryMutation,
  useClearHistoryMutation,
} = dataAgentApi;
