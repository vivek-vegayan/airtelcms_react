import { api } from "../../../../service/api";

export interface ApiNotificationSetting {
  actionCode: string;
  configId: number;
  moduleCode: string;
  notifyDomainHead: boolean;
  notifyFunctionHead: boolean;
  notifySubDomainHead: boolean;
  notifySuperAdmin: boolean;
  notifyTeamMember: boolean;
  notifyVerticalHead: boolean;
  subModuleCode: string;
  isActive: boolean;
}

// UI model matches the API shape exactly
export type TransformedNotificationSetting = ApiNotificationSetting;

/** The boolean columns the generic single-column update endpoint can touch. */
export type NotificationBooleanField = {
  [K in keyof ApiNotificationSetting]: ApiNotificationSetting[K] extends boolean
    ? K
    : never;
}[keyof ApiNotificationSetting];

export type NewNotificationInput = Omit<ApiNotificationSetting, "configId">;

// sp_update_notification_manager builds `SET <columnName> = ?` via raw SQL
// concatenation (no parameter binding for the column name itself), so this
// conversion must only ever be fed one of our own known boolean field names
// — never user-supplied text — to stay safe.
const toDbColumn = (field: string): string =>
  field.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

export const notificationApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotificationConfigs: builder.query<ApiNotificationSetting[], void>({
      query: () => "/notification-manager/show",
      providesTags: ["NotificationConfig"],
    }),

    createNotification: builder.mutation<void, NewNotificationInput>({
      query: (body) => ({
        url: "/notification-manager/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["NotificationConfig"],
    }),

    // Single-column toggle (per-role recipients, or the master isActive
    // switch). Patched optimistically so switches flip instantly; rolled
    // back on failure.
    updateNotificationField: builder.mutation<
      void,
      { configId: number; field: NotificationBooleanField; value: boolean }
    >({
      query: ({ configId, field, value }) => ({
        url: "/notification-manager/update",
        method: "PATCH",
        params: {
          configId,
          columnName: toDbColumn(field),
          newValue: value,
        },
      }),
      async onQueryStarted(
        { configId, field, value },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          notificationApiSlice.util.updateQueryData(
            "getNotificationConfigs",
            undefined,
            (draft) => {
              const row = draft.find((r) => r.configId === configId);
              if (row) row[field] = value;
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    deleteNotification: builder.mutation<void, { configId: number }>({
      query: ({ configId }) => ({
        url: `/notification-manager/delete/${configId}`,
        method: "DELETE",
      }),
      async onQueryStarted({ configId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          notificationApiSlice.util.updateQueryData(
            "getNotificationConfigs",
            undefined,
            (draft) => draft.filter((r) => r.configId !== configId),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

export const {
  useGetNotificationConfigsQuery,
  useCreateNotificationMutation,
  useUpdateNotificationFieldMutation,
  useDeleteNotificationMutation,
} = notificationApiSlice;
