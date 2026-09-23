import { api } from "../../../service/api";
import type {
  FutureWeekApiResponse,
  FutureWeekQueryParams,
} from "../types/Futureweek.types";
import type {
  GoldenSetApiResponse,
  GoldenSetQueryParams,
} from "../types/goldenSet.types";

// ── FutureWeek types ──────────────────────────────────────────────────────────
export interface FutureWeekRow {
  W7D1: string; W7D2: string; W7D3: string; W7D4: string;
  W7D5: string; W7D6: string; W7D7: string;
  employeeName: string;
  id: number;
  isoWeek: number;
  isoYear: number;
  jobLevel: string;
  olmid: string;
  roleCode: string;
  userId: number;
}

export interface UpdateRowPayload {
  userId: number;
  year: number;
  week: number;
  W7D1: string; W7D2: string; W7D3: string; W7D4: string;
  W7D5: string; W7D6: string; W7D7: string;
}

export interface UpdateCellResponse {
  success: boolean;
  message?: string;
}

// ── Daily Golden Set types ────────────────────────────────────────────────────
// NB: lower-case "w" — DailyGoldenSetRequestDto's W1D1..W6D7 fields
// deserialize under Jackson's mangled property names (w1D1..w6D7); the
// upper-case form is rejected as an unrecognized property. See the note on
// GoldenSetApiRow in goldenSet.types.ts.
export interface DailyGoldenSetPayload {
  userId: number;
  w1D1: string; w1D2: string; w1D3: string; w1D4: string; w1D5: string; w1D6: string; w1D7: string;
  w2D1: string; w2D2: string; w2D3: string; w2D4: string; w2D5: string; w2D6: string; w2D7: string;
  w3D1: string; w3D2: string; w3D3: string; w3D4: string; w3D5: string; w3D6: string; w3D7: string;
  w4D1: string; w4D2: string; w4D3: string; w4D4: string; w4D5: string; w4D6: string; w4D7: string;
  w5D1: string; w5D2: string; w5D3: string; w5D4: string; w5D5: string; w5D6: string; w5D7: string;
  w6D1: string; w6D2: string; w6D3: string; w6D4: string; w6D5: string; w6D6: string; w6D7: string;
}

export interface DailyGoldenSetResponse {
  success: boolean;
  message?: string;
}

// ── API slice ─────────────────────────────────────────────────────────────────
export const rosterGenerationApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({

    // ── Golden Set ────────────────────────────────────────────────────────────
    getGoldenSet: builder.query<GoldenSetApiResponse, GoldenSetQueryParams>({
      query: ({ subDomainId }) => ({
        url: `goldenset?subDomainId=${subDomainId}`,
        method: "GET",
      }),
      providesTags: ["GoldenSetTag"],  // ✅ already correct
    }),

    // ── Daily Golden Set — invalidates GoldenSetTag so table auto-refreshes ──
    updateDailyGoldenSet: builder.mutation<
      DailyGoldenSetResponse,
      DailyGoldenSetPayload[]
    >({
      query: (rows) => ({
        url: `goldenset/dailygoldenset`,
        method: "POST",
        body: rows,
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: ["GoldenSetTag"],  // ✅ triggers getGoldenSet refetch
    }),

    // ── Future Week ───────────────────────────────────────────────────────────
    getFutureWeek: builder.query<FutureWeekApiResponse, FutureWeekQueryParams>({
      query: ({ subDomainId, pageNumber = 1, pageSize = 50 }) => ({
        url:
          `rostergenration/futureweek` +
          `?subDomainId=${subDomainId}` +
          `&pageNumber=${pageNumber}` +
          `&pageSize=${pageSize}`,
        method: "GET",
      }),
      providesTags: ["FutureWeekTag"],  // ✅ ADD THIS — was missing
    }),

    updateFutureWeekBatch: builder.mutation<
      UpdateCellResponse,
      UpdateRowPayload[]
    >({
      query: (rows) => ({
        url: `rostergenration/futureweek/update`,
        method: "POST",
        body: rows,
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: ["FutureWeekTag"],  // ✅ ADD THIS — was missing
    }),
  }),
});

export const {
  useGetGoldenSetQuery,
  useLazyGetGoldenSetQuery,
  useLazyGetFutureWeekQuery,
  useGetFutureWeekQuery,
  useUpdateFutureWeekBatchMutation,
  useUpdateDailyGoldenSetMutation,
} = rosterGenerationApiSlice;

// import { api } from "../../../service/api";
// import type {
//   FutureWeekApiResponse,
//   FutureWeekQueryParams,
// } from "../types/Futureweek.types";
// import type {
//   GoldenSetApiResponse,
//   GoldenSetQueryParams,
// } from "../types/goldenSet.types";

// // ── FutureWeek types ──────────────────────────────────────────────────────────
// export interface FutureWeekRow {
//   W7D1: string;
//   W7D2: string;
//   W7D3: string;
//   W7D4: string;
//   W7D5: string;
//   W7D6: string;
//   W7D7: string;
//   employeeName: string;
//   id: number;
//   isoWeek: number;
//   isoYear: number;
//   jobLevel: string;
//   olmid: string;
//   roleCode: string;
//   userId: number;
// }

// // ── Batch update — one item per changed row ───────────────────────────────────
// export interface UpdateRowPayload {
//   /** employee's userId (from NormalisedEmployee.userId) */
//   userId: number;
//   year: number;
//   week: number;
//   W7D1: string;
//   W7D2: string;
//   W7D3: string;
//   W7D4: string;
//   W7D5: string;
//   W7D6: string;
//   W7D7: string;
// }

// export interface UpdateCellResponse {
//   success: boolean;
//   message?: string;
// }

// // ── Daily Golden Set types ────────────────────────────────────────────────────
// export interface DailyGoldenSetPayload {
//   userId: number;
//   W1D1: string; W1D2: string; W1D3: string; W1D4: string; W1D5: string; W1D6: string; W1D7: string;
//   W2D1: string; W2D2: string; W2D3: string; W2D4: string; W2D5: string; W2D6: string; W2D7: string;
//   W3D1: string; W3D2: string; W3D3: string; W3D4: string; W3D5: string; W3D6: string; W3D7: string;
//   W4D1: string; W4D2: string; W4D3: string; W4D4: string; W4D5: string; W4D6: string; W4D7: string;
//   W5D1: string; W5D2: string; W5D3: string; W5D4: string; W5D5: string; W5D6: string; W5D7: string;
//   W6D1: string; W6D2: string; W6D3: string; W6D4: string; W6D5: string; W6D6: string; W6D7: string;
// }

// export interface DailyGoldenSetResponse {
//   success: boolean;
//   message?: string;
// }

// // ── API slice ─────────────────────────────────────────────────────────────────
// export const rosterGenerationApiSlice = api.injectEndpoints({
//   endpoints: (builder) => ({
//     // ── Golden Set ────────────────────────────────────────────────────────────
//     getGoldenSet: builder.query<GoldenSetApiResponse, GoldenSetQueryParams>({
//       query: ({ subDomainId }) => ({
//         url: `goldenset?subDomainId=${subDomainId}`,
//         method: "GET",
//       }),
//       providesTags: ["GoldenSetTag"],
//     }),

//     // ── Daily Golden Set (shift save) ─────────────────────────────────────────
//     updateDailyGoldenSet: builder.mutation<
//       DailyGoldenSetResponse,
//       DailyGoldenSetPayload[]
//     >({
//       query: (rows) => ({
//         url: `goldenset/dailygoldenset`,
//         method: "POST",
//         body: rows,
//         headers: { "Content-Type": "application/json" },
//       }),
//       invalidatesTags: ["GoldenSetTag"],
//     }),

//     // ── Future Week ───────────────────────────────────────────────────────────
//     getFutureWeek: builder.query<FutureWeekApiResponse, FutureWeekQueryParams>({
//       query: ({ subDomainId, pageNumber = 1, pageSize = 50 }) => ({
//         url:
//           `rostergenration/futureweek` +
//           `?subDomainId=${subDomainId}` +
//           `&pageNumber=${pageNumber}` +
//           `&pageSize=${pageSize}`,
//         method: "GET",
//       }),
//     }),

//     updateFutureWeekBatch: builder.mutation<
//       UpdateCellResponse,
//       UpdateRowPayload[]
//     >({
//       query: (rows) => ({
//         url: `rostergenration/futureweek/update`,
//         method: "POST",
//         body: rows,
//         headers: { "Content-Type": "application/json" },
//       }),
//     }),
//   }),
// });

// export const {
//   useGetGoldenSetQuery,
//   useLazyGetGoldenSetQuery,
//   useLazyGetFutureWeekQuery,
//   useGetFutureWeekQuery,
//   useUpdateFutureWeekBatchMutation,
//   useUpdateDailyGoldenSetMutation,
// } = rosterGenerationApiSlice;
