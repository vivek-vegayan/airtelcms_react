import { api } from "../../../service/api";
import type {
  CrqJourneySearchRow,
  CrqJourneyPageResponse,
  CrqDetailsResponse,
} from "../types/crqJourney.types";

// ─────────────────────────────────────────────────────────────────────────────
//  CRQ Journey Explorer — RTK Query endpoints
//  Backs:
//   • /cabmanager/journey    → getCrqsBySubDomain + getCrqJourneyStages
//   • /scheduler/crqjourney  → getCrqsBySubDomain + getCrqDetails
//  See CrqJourneyExplorerController (backend) for the underlying procs.
// ─────────────────────────────────────────────────────────────────────────────
export const crqJourneyExplorerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCrqsBySubDomain: builder.query<CrqJourneySearchRow[], number>({
      query: (subDomainId) => ({
        url: "/crqworkflow/journey-explorer/crqs",
        method: "GET",
        params: { subDomainId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: "CrqReview" as const, id: `JOURNEY-SEARCH-${r.crqNo}` })),
              { type: "CrqReview" as const, id: "JOURNEY-SEARCH-LIST" },
            ]
          : [{ type: "CrqReview" as const, id: "JOURNEY-SEARCH-LIST" }],
    }),

    /**
     * One call, four result sets: the journey stage rows, every CAB service with
     * its decision and its L1/L2/L3 approval ladder, the per-service SPOC
     * contacts, and the CRQ's domain scope.
     *
     * The proc has been re-authored live four times and the payload has grown
     * each time — a bare stage array until 2026-08-24, three sets until
     * 2026-09-08, the SPOC set inserted (not appended) that day, and the
     * approver ladder replacing the single approver on 2026-09-09. The backend
     * reads the sets by column label rather than position for exactly that
     * reason, so an older database degrades instead of mismapping.
     */
    getCrqJourneyStages: builder.query<CrqJourneyPageResponse, string>({
      query: (crqNo) => ({
        url: `/crqworkflow/journey-explorer/${encodeURIComponent(crqNo)}`,
        method: "GET",
      }),
      providesTags: (_r, _e, crqNo) => [{ type: "CrqReview" as const, id: `JOURNEY-STAGES-${crqNo}` }],
    }),

    getCrqDetails: builder.query<CrqDetailsResponse, string>({
      query: (crqNo) => ({
        url: `/crqworkflow/journey-explorer/${encodeURIComponent(crqNo)}/details`,
        method: "GET",
      }),
      providesTags: (_r, _e, crqNo) => [{ type: "CrqReview" as const, id: `JOURNEY-DETAILS-${crqNo}` }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCrqsBySubDomainQuery,
  useLazyGetCrqsBySubDomainQuery,
  useGetCrqJourneyStagesQuery,
  useGetCrqDetailsQuery,
} = crqJourneyExplorerApi;
