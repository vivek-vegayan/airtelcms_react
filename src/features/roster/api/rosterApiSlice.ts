import { api } from "../../../service/api";
import type {
  CurrentShiftCount,
  RosterViewParams,
  RosterViewResponse,
} from "../types/monthlyRoster.type";

export const rosterApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    getRosterView: builder.query<RosterViewResponse, RosterViewParams>({
      query: ({ domainId, subDomainId, startDate, endDate }) => ({
        url: "/monthlyrosterview",
        method: "GET",
        params: {
          domainId,
          subDomainId,
          startDate,
          endDate,
        },
      }),

      // keepUnusedDataFor: 6,
      providesTags: ["RosterVIew"],
    }),
    getCurrentShiftCount: builder.query<
      CurrentShiftCount[],
      { domainId: number; subDomainId: number }
    >({
      query: ({ domainId, subDomainId }) => ({
        url: "/monthlyrosterview/currentshiftcount",
        method: "GET",
        params: { domainId, subDomainId },
      }),
      // Same tag as the roster grid: one "RosterVIew" invalidation (a shift
      // change, or the filter bar's refresh button) reloads grid and counts
      // together, so the header can never disagree with the rows beneath it.
      providesTags: ["RosterVIew"],
    }),

    // mutation for changing a shift using query parameters as per API
    // changeShift: builder.mutation<
    //   { status: string; message: string },
    //   ChangeShiftParams
    // >({
    //   query: (params) => {
    //     return {
    //       url: "/monthlyrosterview/changeshift",
    //       method: "POST",
    //       params: {
    //         affectedUserId: params.affectedUserId,
    //         shiftDate: params.shiftDate,
    //         newShiftId: params.newShiftId, // shiftId selected from dropdown
    //         newAssignActivity: params.newAssignActivity, // assignActCount from roster data or dialog
    //         newAvailableMinutes: params.newAvailableMinutes, // availableMins from roster data or dialog
    //         reason: params.reason,
    //       },
    //     };

    //   },
    //     invalidatesTags: ["RosterVIew"],
    // }),
    changeShift: builder.mutation<
      { success: boolean; message: string },
      ChangeShiftParams
    >({
      query: ({
        affectedUserId,
        shiftDate,
        newShiftId,
        newAssignActivity,
        newAvailableMinutes,
        reason,
      }) => ({
        url: "/monthlyrosterview/changeshift",
        method: "POST",
        params: {
          affectedUserId,
          newAssignActivity,
          newAvailableMinutes,
          shiftDate,
          newShiftId,
          reason,
        },
      }),
      invalidatesTags: ["RosterVIew"],
    }),


    // mutation for shift swap by manager
    shiftSwapByManager: builder.mutation<
      { status: string; message: string },
      ShiftSwapParams
    >({
      query: (params) => ({
        url: "/monthlyrosterview/shiftswapbymanager",
        method: "POST",
        params: {
          affectedUserId1: params.affectedUserId1,
          shiftDate1: params.shiftDate1,
          affectedUserId2: params.affectedUserId2,
          shiftDate2: params.shiftDate2,
          shiftSwapReason: params.shiftSwapReason,
        },
      }),
      invalidatesTags: ["RosterVIew"],
    }),

    // mutation for shift swap request initiated by team member
    shiftSwapRequestByTeamMember: builder.mutation<
      { status: string; message: string },
      TeamMemberSwapParams
    >({
      query: (params) => ({
        url: "/monthlyrosterview/shiftswapreqbyteammember",
        method: "POST",
        params: {
          shiftDate1: params.shiftDate1,
          recipientUserId: params.recipientUserId,
          shiftDate2: params.shiftDate2,
          shiftSwapReason: params.shiftSwapReason,
        },
      }),
      invalidatesTags: ["RosterVIew"],
    }),

    getShiftDropdown: builder.query<
      { shiftId: number; shiftRange: string }[],
      { subDomainId: number }
    >({
      query: ({ subDomainId }) => ({
        url: "/monthlyrosterview/shiftdropdowns",
        method: "GET",
        params: { subDomainId },
      }),
    }),
  }),
});

export const {
  useGetRosterViewQuery,
  useGetCurrentShiftCountQuery,
  useChangeShiftMutation,
  useGetShiftDropdownQuery,
  useShiftSwapByManagerMutation,
  useShiftSwapRequestByTeamMemberMutation, // team‑member endpoint
} = rosterApiSlice;

// types for the mutation input
export interface ChangeShiftParams {
  affectedUserId: string | number;
  newShiftId: number;
  newAssignActivity: number;
  newAvailableMinutes: number;
  shiftDate: string;
  reason?: string;
}

export interface ShiftSwapParams {
  affectedUserId1: string | number;
  shiftDate1: string;
  affectedUserId2: string | number;
  shiftDate2: string;
  shiftSwapReason: string;
}

// parameters for team‑member initiated swap request
export interface TeamMemberSwapParams {
  shiftDate1: string;
  recipientUserId: string | number;
  shiftDate2: string;
  shiftSwapReason: string;
}
