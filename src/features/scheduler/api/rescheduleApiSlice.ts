import { api } from "../../../service/api";
import type {
  RescheduleCalendar,
  RescheduleConfirmResponse,
  RescheduleContext,
  RescheduleInitiateResponse,
  RescheduleMoveStageResponse,
  RescheduleReasonOption,
  RescheduleSlotsResponse,
  RescheduleStatusResponse,
} from "../types/reschedule.types";

/**
 * The reschedule wizard's procedure calls, one endpoint each
 * (CrqRescheduleController -> CRQ_SP_RESCHEDULE_*).
 *
 * Only the reads are queries; every step that writes is a mutation, so the
 * wizard can never fire one twice by re-rendering. Two steps need no request of
 * their own at all: `initiate` returns the scheduling calendar with the attempt,
 * and `move-stage` returns the engineer slots with the stage change - the
 * dedicated calendar/slots endpoints exist only for the Refresh actions, which
 * must recompute without repeating an earlier step.
 */
export const rescheduleApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /crq/reschedule/context?crqId=
    getRescheduleContext: builder.query<RescheduleContext, { crqId: number }>({
      query: ({ crqId }) => ({
        url: "/crq/reschedule/context",
        method: "GET",
        params: { crqId },
      }),
      providesTags: (_r, _e, arg) => [{ type: "CrqReschedule", id: `ctx-${arg.crqId}` }],
    }),

    // GET /crq/reschedule/reason-options - the fixed reason list, sp_reschedule_reason_drop_down
    getRescheduleReasonOptions: builder.query<RescheduleReasonOption[], void>({
      query: () => ({
        url: "/crq/reschedule/reason-options",
        method: "GET",
      }),
      providesTags: ["CrqReschedule"],
    }),

    // POST /crq/reschedule/initiate -> attempt + calendar in one round trip
    initiateReschedule: builder.mutation<
      RescheduleInitiateResponse,
      { crqId: number; reason: string; remark: string }
    >({
      query: (body) => ({
        url: "/crq/reschedule/initiate",
        method: "POST",
        body,
      }),
      // A new attempt row changes what /context reports as in-flight.
      invalidatesTags: (_r, _e, arg) => [{ type: "CrqReschedule", id: `ctx-${arg.crqId}` }],
    }),

    // GET /crq/reschedule/{rescheduleId}/calendar - Refresh only
    getRescheduleCalendar: builder.query<RescheduleCalendar, { rescheduleId: number }>({
      query: ({ rescheduleId }) => ({
        url: `/crq/reschedule/${rescheduleId}/calendar`,
        method: "GET",
      }),
      providesTags: (_r, _e, arg) => [{ type: "CrqReschedule", id: `cal-${arg.rescheduleId}` }],
    }),

    // POST /crq/reschedule/save-date
    saveRescheduleDate: builder.mutation<
      RescheduleStatusResponse,
      { rescheduleId: number; desiredDate: string }
    >({
      query: (body) => ({
        url: "/crq/reschedule/save-date",
        method: "POST",
        body,
      }),
    }),

    // POST /crq/reschedule/move-stage -> stage change + engineer slots
    moveRescheduleStage: builder.mutation<
      RescheduleMoveStageResponse,
      { rescheduleId: number; toStage: string; crqId: number }
    >({
      query: ({ rescheduleId, toStage }) => ({
        url: "/crq/reschedule/move-stage",
        method: "POST",
        body: { rescheduleId, toStage },
      }),
      // The CRQ's current stage and reschedule_count have both changed, so the
      // cockpit's overview and this CRQ's context are now stale.
      invalidatesTags: (_r, _e, arg) => [
        { type: "CrqReschedule", id: `ctx-${arg.crqId}` },
        "CrqReview",
      ],
    }),

    // GET /crq/reschedule/{rescheduleId}/slots - Refresh only
    getRescheduleSlots: builder.query<RescheduleSlotsResponse, { rescheduleId: number }>({
      query: ({ rescheduleId }) => ({
        url: `/crq/reschedule/${rescheduleId}/slots`,
        method: "GET",
      }),
      providesTags: (_r, _e, arg) => [{ type: "CrqReschedule", id: `slots-${arg.rescheduleId}` }],
    }),

    // POST /crq/reschedule/confirm-slot
    confirmRescheduleSlot: builder.mutation<
      RescheduleConfirmResponse,
      { rescheduleId: number; slotLabel: string; crqId: number }
    >({
      query: ({ rescheduleId, slotLabel }) => ({
        url: "/crq/reschedule/confirm-slot",
        method: "POST",
        body: { rescheduleId, slotLabel },
      }),
      // Confirm is the call that commits the whole reschedule, so it falsifies
      // more than this CRQ's own views. Since the 2026-09-16 proc rewrite it
      // writes CRQ_MASTER_TBL's stage/status/reschedule_count (MOVE_STAGE no
      // longer does), and it rebalances ROSTER_SHIFT_TBL capacity for BOTH the
      // old and the new engineer - which is why the roster views are stale here
      // even though the user never opened them.
      invalidatesTags: (_r, _e, arg) => [
        { type: "CrqReschedule", id: `ctx-${arg.crqId}` },
        { type: "CrqReschedule", id: `slots-${arg.rescheduleId}` },
        "CrqReview",
        "RosterVIew",
      ],
    }),

    // POST /crq/reschedule/cancel
    cancelReschedule: builder.mutation<
      RescheduleStatusResponse,
      { rescheduleId: number; reason?: string; crqId: number }
    >({
      query: ({ rescheduleId, reason }) => ({
        url: "/crq/reschedule/cancel",
        method: "POST",
        body: { rescheduleId, reason },
      }),
      // Cancelling after the stage move leaves the CRQ on its new stage (that
      // decision is already in history), so the cockpit still needs refreshing.
      invalidatesTags: (_r, _e, arg) => [
        { type: "CrqReschedule", id: `ctx-${arg.crqId}` },
        { type: "CrqReschedule", id: `slots-${arg.rescheduleId}` },
        "CrqReview",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRescheduleContextQuery,
  useGetRescheduleReasonOptionsQuery,
  useInitiateRescheduleMutation,
  useLazyGetRescheduleCalendarQuery,
  useSaveRescheduleDateMutation,
  useMoveRescheduleStageMutation,
  useLazyGetRescheduleSlotsQuery,
  useConfirmRescheduleSlotMutation,
  useCancelRescheduleMutation,
} = rescheduleApiSlice;
