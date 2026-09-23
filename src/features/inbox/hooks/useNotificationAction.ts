import {
  useAcknowledgeNotificationMutation,
  useEmployeeShiftSwapActionMutation,
  useManagerShiftSwapActionMutation,
  useRosterLeaveActionMutation,
  useShiftChangeNotificationActionMutation,
  useCabCrqNotificationActionMutation,
  useCabRescheduleNotificationActionMutation,
} from "../api/inboxApiSlice";
import type { InboxItem } from "../components/TaskInbox";
import { getRoleTier, getSubModuleActionMeta } from "../config/notificationActionConfig";

export interface NotificationActionExtra {
  // Free-text remark (SHIFT_SWAP/SHIFT_CHANGE/LEAVE reject reason, or the
  // additional comment that accompanies a CAB reject reason).
  reason?: string;
  // Structured reason label for CAB_APPROVER rejects, picked from
  // useGetCabRejectReasonsQuery.
  reasonText?: string;
}

export const useNotificationAction = () => {
  const [managerAction, { isLoading: isManagerLoading }] = useManagerShiftSwapActionMutation();
  const [employeeAction, { isLoading: isEmpLoading }] = useEmployeeShiftSwapActionMutation();
  const [acknowledge, { isLoading: isAckLoading }] = useAcknowledgeNotificationMutation();
  const [leaveAction, { isLoading: isLeaveLoading }] = useRosterLeaveActionMutation();
  const [shiftChangeAction, { isLoading: isShiftChangeLoading }] = useShiftChangeNotificationActionMutation();
  const [cabCrqAction, { isLoading: isCabLoading }] = useCabCrqNotificationActionMutation();
  const [cabRescheduleAction, { isLoading: isCabRescheduleLoading }] = useCabRescheduleNotificationActionMutation();

  const isLoading =
    isManagerLoading ||
    isEmpLoading ||
    isAckLoading ||
    isLeaveLoading ||
    isShiftChangeLoading ||
    isCabLoading ||
    isCabRescheduleLoading;

  // Every failure - a rejected mutation or one of the guards below - leaves
  // here as a throw and is reported by the caller, which has the server's own
  // message ("This reschedule request was already approved.", "CRQ not found
  // for given crq_no"). This hook deliberately toasts nothing: when it also
  // toasted a generic "Failed to process your action", that second, emptier
  // line was the one the user read.
  const handleAction = async (
    item: InboxItem,
    actionType: "APPROVED" | "REJECTED" | "ACKNOWLEDGE",
    userRole: string,
    extra?: NotificationActionExtra,
  ): Promise<any> => {
    const { notificationId, subModule } = item.originalData;

    if (actionType === "ACKNOWLEDGE") {
      return await acknowledge({ notificationId }).unwrap();
    }

    const meta = getSubModuleActionMeta(subModule);
    if (!meta) {
      throw new Error("This type of notification cannot be processed.");
    }

    switch (meta.subModule) {
      case "SHIFT_SWAP": {
        const tier = getRoleTier(userRole);
        if (tier === "MANAGER") {
          return await managerAction({
            notificationId,
            status: actionType,
            reason: extra?.reason,
          }).unwrap();
        }
        if (userRole === "TEAM_MEMBER") {
          return await employeeAction({
            notificationId,
            status: actionType,
            reason: extra?.reason,
          }).unwrap();
        }
        throw new Error("You do not have permission to perform this action.");
      }

      case "SHIFT_CHANGE":
        return await shiftChangeAction({
          notificationId,
          status: actionType,
          rejectReason: extra?.reason,
        }).unwrap();

      case "LEAVE":
        return await leaveAction({
          notificationId,
          status: actionType,
          rejectReason: extra?.reason,
        }).unwrap();

      case "CAB_APPROVER":
        return await cabCrqAction({
          notificationId,
          status: actionType,
          reason: extra?.reasonText,
          comment: extra?.reason,
        }).unwrap();

      // Same shape as CAB_APPROVER: `reason` is the structured label when the
      // dialog offers one, `comment` the free-text remark. The reschedule
      // dialog is TEXT-only today, so only the remark travels.
      case "RESCHEDULE":
        return await cabRescheduleAction({
          notificationId,
          status: actionType,
          reason: extra?.reasonText,
          comment: extra?.reason,
        }).unwrap();

      default:
        throw new Error("This type of notification cannot be processed.");
    }
  };

  return { handleAction, isLoading };
};
