import { api } from "../../../service/api";

// ─── Holiday types ────────────────────────────────────────────────────────────
export interface Holiday {
  holidayId?: number;
  holidayDate: string;
  holidayDay: string;
  holidayOccasion: string;
  location: string;
}

export interface LocationOption {
  location: string;
}

// ─── Network Freeze types ─────────────────────────────────────────────────────
export interface NetworkFreeze {
  freezeId: number;
  freezeName: string;
  startDateTime: string; // "2026-08-14T18:00:00"
  endDateTime: string;
}

export interface ApiResponse {
  status: string;
  message: string;
}

// ─── Slice ────────────────────────────────────────────────────────────────────
export const globalSettingApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Holiday ──────────────────────────────────────────────────────────────
    getHolidayData: builder.query<Holiday[], void>({
      query: () => ({ url: "/networkfreez/holiday/view", method: "GET" }),
      providesTags: ["Holiday"],
    }),

    getLocationOptions: builder.query<LocationOption[], void>({
      query: () => ({
        url: "/networkfreez/holiday/location/dropdown",
        method: "GET",
      }),
    }),

    addHoliday: builder.mutation<
      ApiResponse,
      { location: string; holidayDate: string; holidayOccasion: string }
    >({
      query: ({ location, holidayDate, holidayOccasion }) => ({
        url: "/networkfreez/holiday/insert",
        method: "POST",
        params: { location, holidayDate, holidayOccasion },
      }),
      invalidatesTags: ["Holiday"],
    }),

    updateHoliday: builder.mutation<
      ApiResponse,
      { location: string; holidayId:number ; holidayDate: string; holidayOccasion: string }
    >({
      query: ({ location,holidayId, holidayDate, holidayOccasion }) => ({
        url: "/networkfreez/holiday/update",
        method: "PATCH",
        params: { location,holidayId, holidayDate, holidayOccasion },
      }),
      invalidatesTags: ["Holiday"],
    }),

    deleteHoliday: builder.mutation<ApiResponse, number>({
      query: (id) => ({
        url: `/networkfreez/holiday/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Holiday"],
    }),

    // ── Network Freeze ────────────────────────────────────────────────────────
    getNetworkFreezeData: builder.query<NetworkFreeze[], void>({
      query: () => ({
        url: "/networkfreez/networkfreezedays/view",
        method: "GET",
      }),
      providesTags: ["NetworkFreeze"],
    }),

    addNetworkFreeze: builder.mutation<
      ApiResponse,
      {
        freezeName: string;
        startDateTime: string;
        endDateTime: string;
        remarks: string;
      }
    >({
      query: ({ freezeName, startDateTime, endDateTime, remarks }) => ({
        url: "/networkfreez/networkfreeze/insert",
        method: "POST",
        params: { freezeName, startDateTime, endDateTime, remarks },
      }),
      invalidatesTags: ["NetworkFreeze"],
    }),

    updateNetworkFreeze: builder.mutation<
      ApiResponse,
      {
        freezeId: number;
        freezeName: string;
        startDateTime: string;
        endDateTime: string;
        remarks: string;
      }
    >({
      query: ({ freezeId, freezeName, startDateTime, endDateTime, remarks }) => ({
        url: "/networkfreez/networkfreeze/update",
        method: "PATCH",
        params: { freezeId, freezeName, startDateTime, endDateTime, remarks },
      }),
      invalidatesTags: ["NetworkFreeze"],
    }),

    deleteNetworkFreeze: builder.mutation<ApiResponse, number>({
      query: (freezeId) => ({
        url: `/networkfreez/networkfreeze/delete/${freezeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["NetworkFreeze"],
    }),
  }),
});

export const {
  // Holiday
  useGetHolidayDataQuery,
  useGetLocationOptionsQuery,
  useAddHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  // Network Freeze
  useGetNetworkFreezeDataQuery,
  useAddNetworkFreezeMutation,
  useUpdateNetworkFreezeMutation,
  useDeleteNetworkFreezeMutation,
} = globalSettingApiSlice;

// import { api } from "../../../service/api";

// export interface Holiday {
//   holidayId?: number;
//   holidayDate: string;
//   holidayDay: string;
//   holidayOccasion: string;
//   location: string;
// }

// export interface LocationOption {
//   location: string;
// }

// export const globalSettingApiSlice = api.injectEndpoints({
//   endpoints: (builder) => ({
//     getHolidayData: builder.query<Holiday[], void>({
//       query: () => ({
//         url: "/networkfreez/holiday/view",
//         method: "GET",
//       }),
//       providesTags: ["Holiday"],
//     }),
//     getLocationOptions: builder.query<LocationOption[], void>({
//       query: () => ({
//         url: "/networkfreez/holiday/location/dropdown",
//         method: "GET",
//       }),
//     }),

//     addHoliday: builder.mutation<
//       { status: string; message: string },
//       { location: string; holidayDate: string; holidayOccasion: string }
//     >({
//       query: ({ location, holidayDate, holidayOccasion }) => ({
//         url: "/networkfreez/holiday/insert",
//         method: "POST",
//         params: { location, holidayDate, holidayOccasion },
//       }),
//       invalidatesTags: ["Holiday"],
//     }),

//     // /holiday/insert

//     updateHoliday: builder.mutation<
//       { status: string; message: string },
//       { location: string; holidayDate: string; holidayOccasion: string }
//     >({
//       query: ({ location, holidayDate, holidayOccasion }) => ({
//         url: "/networkfreez/holiday/update",
//         method: "PATCH",
//         params: { location, holidayDate, holidayOccasion },
//       }),
//       invalidatesTags: ["Holiday"],
//     }),

//     deleteHoliday: builder.mutation<
//       { status: string; message: string },
//       number
//     >({
//       query: (id) => ({
//         url: `/networkfreez/holiday/delete/${id}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: ["Holiday"],
//     }),
//   }),
// });

// export const {
//   useGetHolidayDataQuery,
//   useAddHolidayMutation,
//   useUpdateHolidayMutation,
//   useDeleteHolidayMutation,
//   useGetLocationOptionsQuery,
// } = globalSettingApiSlice;
