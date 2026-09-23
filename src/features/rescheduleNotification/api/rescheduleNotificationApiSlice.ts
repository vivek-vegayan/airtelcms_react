import { api } from "../../../service/api";

export interface ApproveCabRescheduleArg {
  crqNo: string;
  /** ISO 8601 timestamp */
  slotStart: string;
  /** ISO 8601 timestamp */
  slotEnd: string;
}

export interface CabRescheduleActionResult {
  status: string;
  message: string;
}

/**
 * Backs the "Reschedule Notifications" Approve action against
 * sp_approve_crq_cab_reschedule_req (POST /cab/crqs/reschedule-requests/{crqNo}/approve).
 * The notification list itself is still mock data - only Approve is wired live.
 */
export const rescheduleNotificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    approveCabReschedule: builder.mutation<CabRescheduleActionResult, ApproveCabRescheduleArg>({
      query: ({ crqNo, slotStart, slotEnd }) => ({
        url: `/cab/crqs/reschedule-requests/${encodeURIComponent(crqNo)}/approve`,
        method: "POST",
        body: { slotStart, slotEnd },
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useApproveCabRescheduleMutation } = rescheduleNotificationApi;
