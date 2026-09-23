import { api } from "../../../service/api";
import type {
  CancelledCrqFilters,
  CancelledCrqPage,
  CancelledCrqSummary,
} from "../types/cancelledCrq.types";

/**
 * Cancelled CRQ registry endpoints.
 *
 * Unlike the stage endpoints in crqreviewApiSlice, no org level is required
 * and none is defaulted: an undefined level is dropped from the query string
 * and the backend then does not narrow on it. That is what makes the screen
 * open on everything the caller may see rather than on one sub-domain.
 *
 * The list and the summary are two calls on purpose — the summary depends
 * only on the filters, so paging through the register does not re-aggregate
 * the whole population on every page click.
 */

/** Filters -> query params, omitting every level the user has not picked. */
const scopeParams = (filters: CancelledCrqFilters) => ({
  verticalId: filters.verticalId ?? undefined,
  functionId: filters.functionId ?? undefined,
  domainId: filters.domainId ?? undefined,
  subDomainId: filters.subDomainId ?? undefined,
  search: filters.search?.trim() || undefined,
});

export const cancelledCrqApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /crqworkflow/cancelled — paged register, newest cancellation first.
    getCancelledCrqs: builder.query<
      CancelledCrqPage,
      CancelledCrqFilters & { page: number; size: number }
    >({
      query: ({ page, size, ...filters }) => ({
        url: "/crqworkflow/cancelled",
        method: "GET",
        params: { ...scopeParams(filters), page, size },
      }),
      providesTags: ["CancelledCrq"],
    }),

    // GET /crqworkflow/cancelled/summary — stat strip over the same filters.
    getCancelledCrqSummary: builder.query<CancelledCrqSummary, CancelledCrqFilters>({
      query: (filters) => ({
        url: "/crqworkflow/cancelled/summary",
        method: "GET",
        params: scopeParams(filters),
      }),
      providesTags: ["CancelledCrq"],
    }),
  }),
});

export const { useGetCancelledCrqsQuery, useGetCancelledCrqSummaryQuery } =
  cancelledCrqApiSlice;
