import { api } from "../../../../../service/api";
import type { AttributeUpdateDetailsResponse } from "../types/attributeUpdate.types";

export interface AttributeUpdateSaveSection {
  [field: string]: string | null | undefined;
}

export interface AttributeUpdateSavePayload {
  crqNo: string;
  /** CRQ_MASTER_TBL.current_stage enum value, e.g. "IMPACT_ANALYSIS". */
  cmsStage: string;
  remedy?: AttributeUpdateSaveSection;
  cab?: AttributeUpdateSaveSection;
  cygnet?: AttributeUpdateSaveSection;
}

/** One section's outcome. `message` is set only when `status` is "Error". */
export interface AttributeUpdateSaveSectionResult {
  /** "Remedy" | "CAB" | "Cygnet" */
  section: string;
  status: "Success" | "Error";
  message?: string | null;
}

/**
 * Mirrors backend AttributeUpdateSaveResponseDto.
 *
 * `status` rolls the sections up: "Success" (all ok), "Partial" (some ok),
 * "Error" (none ok). `message` is the same joined summary the endpoint always
 * returned - kept for logs and as the fallback when `sections` is empty.
 */
export interface AttributeUpdateSaveResponse {
  status?: string;
  message?: string;
  sections?: AttributeUpdateSaveSectionResult[];
}

export const attributeUpdateApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /attributeupdate/details?crqNo=&cmsStage= - latest saved Remedy /
    // CAB / Cygnet snapshot for this CRQ at this stage, one round trip.
    getAttributeUpdateDetails: builder.query<
      AttributeUpdateDetailsResponse,
      { crqNo: string; cmsStage: string }
    >({
      query: ({ crqNo, cmsStage }) => ({
        url: "/attributeupdate/details",
        method: "GET",
        params: { crqNo, cmsStage },
      }),
      providesTags: ["AttributeUpdate"],
    }),

    // The three Change Implementer dropdown levels (Remedy's ChgImpCpy /
    // ChgImpOrg / ChgImpGrp). Each level narrows the next, so the caller passes
    // every level above it; the backend fronts GET_IMPL_COMPANY_DROPDOWN /
    // GET_IMPL_ORG_DROPDOWN / GET_IMPL_GROUP_DROPDOWN. Options are per-company /
    // per-organization reference data, not per-CRQ, so RTK Query's cache keeps
    // one copy per combination across every open stage card and CRQ - no tag,
    // nothing invalidates them.

    // GET /attributeupdate/dropdown/impl-company
    getImplCompanyOptions: builder.query<string[], void>({
      query: () => ({ url: "/attributeupdate/dropdown/impl-company", method: "GET" }),
    }),

    // GET /attributeupdate/dropdown/impl-organization?company=
    getImplOrganizationOptions: builder.query<string[], { company: string }>({
      query: ({ company }) => ({
        url: "/attributeupdate/dropdown/impl-organization",
        method: "GET",
        params: { company },
      }),
    }),

    // GET /attributeupdate/dropdown/impl-group?company=&organization=
    getImplGroupOptions: builder.query<string[], { company: string; organization: string }>({
      query: ({ company, organization }) => ({
        url: "/attributeupdate/dropdown/impl-group",
        method: "GET",
        params: { company, organization },
      }),
    }),

    // POST /attributeupdate/save - saves whichever of remedy/cab/cygnet the
    // caller includes for the current stage. Each section succeeds or fails on
    // its own, so the response carries a per-section breakdown alongside the
    // rolled-up status/message; `sections` is empty only when the request blew
    // up before any section ran.
    saveAttributeUpdate: builder.mutation<
      AttributeUpdateSaveResponse,
      AttributeUpdateSavePayload
    >({
      query: (payload) => ({
        url: "/attributeupdate/save",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["AttributeUpdate"],
    }),
  }),
});

export const {
  useGetAttributeUpdateDetailsQuery,
  useGetImplCompanyOptionsQuery,
  useGetImplOrganizationOptionsQuery,
  useGetImplGroupOptionsQuery,
  useSaveAttributeUpdateMutation,
} = attributeUpdateApiSlice;
