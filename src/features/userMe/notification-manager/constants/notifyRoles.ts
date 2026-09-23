import type { ApiNotificationSetting } from "../api/notificationApiSlice";

/** The boolean notify* keys of a notification rule. */
export type NotifyToggleField = {
  [K in keyof ApiNotificationSetting]: ApiNotificationSetting[K] extends boolean
    ? K
    : never;
}[keyof ApiNotificationSetting];

export interface NotifyRoleColumn {
  field: NotifyToggleField;
  label: string;
  /** Shorter form for narrow column headers; `label` stays the full,
   * descriptive text used in tooltips and aria-labels. */
  shortLabel: string;
}

/** Single source of truth for the per-role toggle columns. */
export const NOTIFY_ROLES: readonly NotifyRoleColumn[] = [
  { field: "notifyDomainHead", label: "Domain Head", shortLabel: "Domain" },
  { field: "notifyFunctionHead", label: "Function Head", shortLabel: "Function" },
  { field: "notifySubDomainHead", label: "Sub-Domain Head", shortLabel: "Sub-Domain" },
  { field: "notifySuperAdmin", label: "Super Admin", shortLabel: "Admin" },
  { field: "notifyTeamMember", label: "Team Member", shortLabel: "Team" },
  { field: "notifyVerticalHead", label: "Vertical Head", shortLabel: "Vertical" },
];

/** A rule is "Active" when at least one role toggle is on. */
export const isAnyNotifyEnabled = (rule: ApiNotificationSetting): boolean =>
  NOTIFY_ROLES.some(({ field }) => rule[field]);
