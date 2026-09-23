import type { NotificationItem } from "../api/inboxApiSlice";

// The backend has no separate "notification type" column - is_actionable +
// request_status together already say everything the UI needs to decide
// which actions to show:
//   isActionable=1, requestStatus=PENDING          -> needs a decision
//   isActionable=1, requestStatus=COMPLETED/CLOSED -> already decided
//   isActionable=0                                 -> informational only
export type NotificationDecisionType =
  | "APPROVAL_REQUIRED"
  | "APPROVAL_COMPLETED"
  | "INFORMATION";

export function coerceBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "1" || value === 1;
}

export function isNotificationUnread(readFlag: unknown): boolean {
  return !coerceBoolean(readFlag);
}

export function deriveDecisionType(
  isActionable: unknown,
  requestStatus: string | null | undefined,
): NotificationDecisionType {
  if (coerceBoolean(isActionable)) {
    return requestStatus === "PENDING" ? "APPROVAL_REQUIRED" : "APPROVAL_COMPLETED";
  }
  return "INFORMATION";
}

export function decisionTypeLabel(type: NotificationDecisionType): string {
  switch (type) {
    case "APPROVAL_REQUIRED":
      return "Action Required";
    case "APPROVAL_COMPLETED":
      return "Approval Completed";
    case "INFORMATION":
    default:
      return "Information";
  }
}

export function deriveNotificationDecisionType(
  notification: Pick<NotificationItem, "isActionable" | "requestStatus">,
): NotificationDecisionType {
  return deriveDecisionType(notification.isActionable, notification.requestStatus);
}
