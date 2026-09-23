import { useCallback } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getStageConfig } from "../constants/stageConfig";
import {
  useUpdateStageStatusMutation,
  useSubmitStageDoneMutation,
} from "../api/stageWorkflowApiSlice";
import { useStageRefresh } from "./useStageRefresh";
import type {
  StageActionError,
  StageActionErrorCode,
  StageKey,
  StageSubmitResult,
} from "../types/stageWorkflow.types";
import type { RootState } from "../../../app/store";

const TOAST_OPTS = {
  position: "top-right" as const,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

const KNOWN_ERROR_CODES: StageActionErrorCode[] = [
  "CRQ_NOT_FOUND",
  "STAGE_MISMATCH",
  "OPS_DEPLOY_TASK_OPEN",
  "CAB_APPROVAL_PENDING",
  "CAB_APPROVAL_REJECTED",
  "INVALID_OUTCOME",
  "STAGE_ACTION_FAILED",
];

/**
 * Reads the coded refusal off an RTK Query error. The backend answers a
 * blocked outcome with `StageActionErrorResponse` (status/message/code/hint);
 * anything without a recognised `code` - a 500, a proxy error, a network
 * drop - is not a refusal we can explain, so it stays out of the inline
 * alert and is toasted instead.
 */
const readStageActionError = (error: any): StageActionError | undefined => {
  const data = error?.data;
  const code = data?.code;
  if (!code || !KNOWN_ERROR_CODES.includes(code)) return undefined;
  return {
    code,
    message: data.message ?? "This action was refused.",
    hint: data.hint ?? undefined,
    stage: data.stage ?? undefined,
    crqNo: data.crqNo ?? undefined,
  };
};

export const useStageWorkflow = (stageKey: StageKey) => {
  const stageConfig = getStageConfig(stageKey);
  const currentUserOlmId = useSelector(
    (state: RootState) => state.auth.user?.olmId,
  );
  const [updateStageStatus, { isLoading: isTogglingStatus }] =
    useUpdateStageStatusMutation();
  const [submitStageDone, { isLoading: isSubmittingDone }] =
    useSubmitStageDoneMutation();

  /**
   * Re-pulls this stage's listing and the cockpit's CRQ data. Used by the
   * blocked-outcome alert: when the procedure refused because the CRQ had
   * already moved on (or vanished), what's on screen is stale and the only
   * useful next action is to reload it.
   */
  const refreshStage = useStageRefresh(stageKey);

  const toggleStartPause = useCallback(
    async (crq: any) => {
      try {
        const isRunning = crq?.[stageConfig.statusField] === "In Progress";
        const action = isRunning ? "pause" : "start";

        const response = await updateStageStatus({
          stageKey,
          crqNo: crq.crqNo,
          crqId: crq.crqId,
          action,
        }).unwrap();

        toast.success(
          response?.message || `${stageConfig.label} updated successfully.`,
          TOAST_OPTS,
        );

        return {
          success: true,
          nextStatus: isRunning ? "Paused" : "In Progress",
        };
      } catch (error: any) {
        toast.error(
          error?.data?.message ||
            `Failed to update ${stageConfig.label}. Please try again.`,
        );
        return { success: false, nextStatus: null };
      }
    },
    [stageKey, stageConfig, updateStageStatus],
  );

  const submitDone = useCallback(
    async (
      formValues: Record<string, any>,
      crq: any,
    ): Promise<StageSubmitResult> => {
      try {
        const payload = stageConfig.buildDonePayload(formValues, crq, {
          currentUserOlmId,
        });
        const response = await submitStageDone({
          stageKey,
          ...payload,
        } as any).unwrap();

        toast.success(
          response?.message ||
            `${stageConfig.label} submitted for ${crq?.crqNo}.`,
        );
        return { success: true };
      } catch (error: any) {
        const stageError = readStageActionError(error);

        // A coded refusal is rendered inline in the form, where it stays put
        // next to the outcome that triggered it and can carry its own
        // follow-up action - a 3s toast is the wrong surface for "CAB
        // approval is still pending". Everything else still toasts.
        if (stageError) return { success: false, error: stageError };

        toast.error(
          error?.data?.message ||
            `Submission failed for ${stageConfig.label}. Please try again.`,
        );
        return { success: false };
      }
    },
    [stageKey, stageConfig, submitStageDone, currentUserOlmId],
  );

  return {
    stageConfig,
    toggleStartPause,
    submitDone,
    refreshStage,
    isTogglingStatus,
    isSubmittingDone,
  };
};
