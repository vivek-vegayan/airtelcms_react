import { api } from "../../../../service/api";
import type {CreateLeavePayload, LeaveHistoryResponse } from "../types/leave.types";

export const leaveApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    getLeaveHistory: builder.query<LeaveHistoryResponse[], void>({
      query: () => ({ url: "/leave/history", method: "GET" }),
      keepUnusedDataFor: 60,
      providesTags: ["Leave"],
    }),

    applyLeave: builder.mutation<
      { status: "Success" | "Error"; message: string },
      CreateLeavePayload
    >({
      query: ({
        leaveType,
        startDate,
        endDate,
        reason,
        leaveDuration,
        session,
      }) => ({
        url: "/leave/request",
        method: "POST",
        params: {
          leaveStartDate: startDate,
          leaveEndDate: leaveDuration === "Half Day" ? startDate : endDate,
          leaveType:
            leaveType.charAt(0).toUpperCase() +
            leaveType.slice(1).toLowerCase(),
          leaveDuration, // "FullDay" | "HalfDay"
          ...(leaveDuration === "Half Day" && { session }), // "Morning" | "Afternoon"
          leaveReason: reason,
        },
      }),
      invalidatesTags: ["Leave"],
    }),

    getLeaveTypes: builder.query<{ leaveType: string }[], void>({
      query: () => ({ url: "/leave/types", method: "GET" }),
      keepUnusedDataFor: 60,
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetLeaveHistoryQuery,
  useApplyLeaveMutation,
  useGetLeaveTypesQuery,
} = leaveApiSlice;
