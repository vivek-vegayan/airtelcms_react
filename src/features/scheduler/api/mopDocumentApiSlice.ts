import { api } from "../../../service/api";
import type { MopCreateDetails } from "../types/mopDocument.types";

/**
 * The MOP Create stage's document panel - the read-only CRQ header and the
 * MOP PDF itself.
 *
 * All three endpoints are thin wrappers over stored procedures that already
 * existed (`SP_GET_MOP_DETAILS_BY_CRQN`, `SP_STORE_CRQ_MOP_CREATE_PDF`,
 * `SP_GET_CRQ_MOP_CREATE_PDF`); none of them were changed to build this.
 * They live in their own slice rather than in `stageWorkflowApiSlice`
 * because that slice is stage-agnostic by design - every endpoint in it is
 * keyed by `StageKey` and shared by all seven stages, while these are
 * specific to MOP Create.
 */
export const mopDocumentApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /crqworkflow/mopcreate/{crqNo}/details
    getMopCreateDetails: builder.query<MopCreateDetails, string>({
      query: (crqNo) => ({
        url: `/crqworkflow/mopcreate/${crqNo}/details`,
        method: "GET",
      }),
      providesTags: (_result, _error, crqNo) => [{ type: "MopDocument", id: crqNo }],
    }),

    // POST /crqworkflow/mopcreate/{crqNo}/details - creates the MOP record
    // through SP_GET_MOP_DETAILS_BY_CRQN. Named like a read but it writes:
    // `mop`, `mop_version` v1, `mop_file` and an audit entry. It refuses a
    // second call ("A MOP already exists for this CRQ"), which is why this is
    // a mutation the reviewer triggers once rather than part of the query
    // above - driving it off the dialog's GET created a MOP on first open and
    // then failed on every open after.
    createMop: builder.mutation<MopCreateDetails, string>({
      query: (crqNo) => ({
        url: `/crqworkflow/mopcreate/${crqNo}/details`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, crqNo) => [{ type: "MopDocument", id: crqNo }],
    }),

    // GET /crqworkflow/mopcreate/{crqNo}/pdf - a real application/pdf stream,
    // or 404 JSON when nothing is stored. Only fetched once `documentAttached`
    // says there is something to fetch, so a 404 here is a genuine error
    // rather than the ordinary "not uploaded yet" case.
    getMopCreatePdf: builder.query<Blob, string>({
      query: (crqNo) => ({
        url: `/crqworkflow/mopcreate/${crqNo}/pdf`,
        method: "GET",
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
      providesTags: (_result, _error, crqNo) => [{ type: "MopDocument", id: `${crqNo}-pdf` }],
    }),

    // POST /crqworkflow/mopcreate/{crqNo}/pdf (multipart)
    uploadMopCreatePdf: builder.mutation<
      { status?: string; message?: string },
      { crqNo: string; file: File }
    >({
      query: ({ crqNo, file }) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: `/crqworkflow/mopcreate/${crqNo}/pdf`,
          method: "POST",
          body,
        };
      },
      // Both the header (documentAttached flips) and the stored document
      // itself are stale after an upload.
      invalidatesTags: (_result, _error, arg) => [
        { type: "MopDocument", id: arg.crqNo },
        { type: "MopDocument", id: `${arg.crqNo}-pdf` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateMopMutation,
  useGetMopCreateDetailsQuery,
  useGetMopCreatePdfQuery,
  useLazyGetMopCreatePdfQuery,
  useUploadMopCreatePdfMutation,
} = mopDocumentApiSlice;
