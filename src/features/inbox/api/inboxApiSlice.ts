import { api } from "../../../service/api";

export interface NotificationPayload {
  body: string;
  subject: string;
  entity_id: number;
  event_key: string;
  action_code: string;
  module_code: string;
  actor_user_id: number;
  recipient_type: string;
  sub_module_code: string;
}

export interface NotificationItem {
  notificationId: number;
  createdAt: string;
  isActionable: string;
  payload: string;
  readFlag: string;
  requestStatus: string;
  senderUserId: number | null;
  subModule: string | null;
  subject: string | null;
}

const notificationListTags = (result?: NotificationItem[]) =>
  result
    ? [
        ...result.map((n) => ({ type: "NotificationList" as const, id: n.notificationId })),
        { type: "NotificationList" as const, id: "LIST" },
      ]
    : [{ type: "NotificationList" as const, id: "LIST" }];

const notificationActionTags = [
  "NotificationCount" as const,
  { type: "NotificationList" as const, id: "LIST" },
];

// An empty inbox is not a failure. The stored procedure behind /notification/unread
// answers "nothing pending" with an error row, and older backends hand that back as
// a 500 - which RTK Query records as an error while KEEPING the last good list, so
// the notification just approved never left the screen. The backend now answers 200
// with [], and this maps the legacy 500 to the same thing, so the inbox clears
// against either build. Anything else is a real error and still surfaces as one.
const EMPTY_INBOX_MESSAGE = /no\s+pending\s+notification/i;

const isEmptyInboxError = (error: unknown): boolean => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return typeof message === "string" && EMPTY_INBOX_MESSAGE.test(message);
};

export const inboxApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    getUnreadNotifications: builder.query<
      NotificationItem[],
      { readFlag: number }
    >({
      queryFn: async ({ readFlag }, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery(
          `/notification/unread?readFlag=${readFlag}`,
        );

        if (result.error) {
          return isEmptyInboxError(result.error)
            ? { data: [] }
            : { error: result.error };
        }

        return { data: (result.data as NotificationItem[] | null) ?? [] };
      },
      providesTags: notificationListTags,
    }),

    getUnreadNotificationCount: builder.query<
      { notificationCount: number },
      void
    >({
      query: () => `/notification/notificationcount?readFlag=0`,
      providesTags: ["NotificationCount"],
    }),

    // Generic mark-as-read for any notification (actionable or not).
    acknowledgeNotification: builder.mutation<any, { notificationId: number }>({
      query: ({ notificationId }) => ({
        url: `/notification/changedreadstatus?notificationId=${notificationId}`,
        method: "POST",
      }),
      invalidatesTags: notificationActionTags,
    }),

    // SHIFT_SWAP
    managerShiftSwapAction: builder.mutation<any, { notificationId: number; status: string; reason?: string }>({
      query: ({ notificationId, status, reason }) => ({
        url: `/notification/swapreqmanageraction?notificationId=${notificationId}&status=${status}&shiftSwapRejectReason=${encodeURIComponent(reason || "")}`,
        method: "POST",
      }),
      invalidatesTags: [...notificationActionTags, "RosterVIew"],
    }),
    employeeShiftSwapAction: builder.mutation<
      any,
      { notificationId: number; status: string; reason?: string }
    >({
      query: ({ notificationId, status, reason }) => ({
        url: `/notification/swapreqempaction?notificationId=${notificationId}&status=${status}&rejectReason=${encodeURIComponent(reason || "")}`,
        method: "POST",
      }),
      invalidatesTags: [...notificationActionTags, "RosterVIew"],
    }),

    // SHIFT_CHANGE (self-service shift change requests approved/rejected by a manager)
    shiftChangeNotificationAction: builder.mutation<
      any,
      { notificationId: number; status: string; rejectReason?: string }
    >({
      query: ({ notificationId, status, rejectReason }) => ({
        url: `/notification/shiftchangenotificationaction?notificationId=${notificationId}&status=${status}&rejectReason=${encodeURIComponent(rejectReason || "")}`,
        method: "POST",
      }),
      invalidatesTags: [...notificationActionTags, "RosterVIew"],
    }),

    // LEAVE
    rosterLeaveAction: builder.mutation<
      any,
      { notificationId: number; status: string; rejectReason?: string }
    >({
      query: ({ notificationId, status, rejectReason }) => ({
        url: `/notification/leave-requests/${notificationId}/status?notificationId=${notificationId}&status=${status}&rejectReason=${encodeURIComponent(rejectReason || "")}`,
        method: "PATCH",
      }),
      invalidatesTags: [...notificationActionTags, "Leave", "RosterVIew"],
    }),

    // CRQ CAB approvals
    cabCrqNotificationAction: builder.mutation<
      any,
      { notificationId: number; status: string; reason?: string; comment?: string }
    >({
      query: ({ notificationId, status, reason, comment }) => ({
        url: `/notification/cabcrqnotificationaction?notificationId=${notificationId}&status=${status}&reason=${encodeURIComponent(reason || "")}&comment=${encodeURIComponent(comment || "")}`,
        method: "POST",
      }),
      invalidatesTags: [...notificationActionTags, "CabCrq", "CabQueue", "CabDashboard"],
    }),

    // CAB reschedule requests (Requested_Start/End proposed by sp_reschedule_cab_crq).
    // Blank reason/comment are left off the query string rather than sent as "":
    // the reject procedure files the remark as COALESCE(comment, reason, 'Rejected'),
    // and an empty string is not null, so sending one stored a blank remark where
    // the default belonged.
    cabRescheduleNotificationAction: builder.mutation<
      any,
      { notificationId: number; status: string; reason?: string; comment?: string }
    >({
      query: ({ notificationId, status, reason, comment }) => {
        const params = new URLSearchParams({
          notificationId: String(notificationId),
          status,
        });
        if (reason?.trim()) params.set("reason", reason.trim());
        if (comment?.trim()) params.set("comment", comment.trim());

        return {
          url: `/notification/cabreschedulenotificationaction?${params.toString()}`,
          method: "POST",
        };
      },
      invalidatesTags: [
        ...notificationActionTags,
        "CabCrq",
        "CabQueue",
        "CabDashboard",
        "CrqReschedule",
        "RosterVIew",
      ],
    }),
  }),
});

export const {
  useGetUnreadNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useEmployeeShiftSwapActionMutation,
  useAcknowledgeNotificationMutation,
  useManagerShiftSwapActionMutation,
  useShiftChangeNotificationActionMutation,
  useRosterLeaveActionMutation,
  useCabCrqNotificationActionMutation,
  useCabRescheduleNotificationActionMutation,
} = inboxApiSlice;
