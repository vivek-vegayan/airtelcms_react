import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../app/hooks";
import { api } from "../../../../../service/api";
import { STAGE_ID_TO_ENUM, type WorkflowStageId } from "../../../constants/workflowStages";
import { closeAttributeUpdateDialog } from "../slices/attributeUpdate.slice";
import {
  selectAttributeCrq,
  selectAttributeCrqStatus,
  selectAttributeCurrentStageId,
  selectAttributeDetailsFetching,
  selectAttributeDialogOpen,
  selectAttributeStageMeta,
} from "../selectors/attributeUpdate.selectors";
import type { StageDialogMode, StageMeta } from "../types/attributeUpdate.types";

/** Dialog-level state: which CRQ is open, its current stage, and the close handler. */
export function useAttributeUpdate() {
  const dispatch = useAppDispatch();

  const dialogOpen = useAppSelector(selectAttributeDialogOpen);
  const crq = useAppSelector(selectAttributeCrq);
  const currentStageId = useAppSelector(selectAttributeCurrentStageId);
  const crqStatus = useAppSelector(selectAttributeCrqStatus);
  const stageMeta = useAppSelector(selectAttributeStageMeta);

  const isRefreshing = useAppSelector(selectAttributeDetailsFetching);

  const close = useCallback(() => dispatch(closeAttributeUpdateDialog()), [dispatch]);

  /**
   * Re-pulls what the dialog shows without leaving it. Invalidating tags rather
   * than calling one card's refetch is what lets a single handler serve all seven
   * cards: whichever are open refetch, the rest are a no-op. The host page's
   * CRQ list goes with it (the tags useStageRefresh uses), so closing the dialog
   * lands on a current page instead of the pre-edit one.
   */
  const refresh = useCallback(() => {
    dispatch(
      api.util.invalidateTags([
        "AttributeUpdate" as const,
        "StageWorkflow" as const,
        "CrqReview" as const,
      ]),
    );
  }, [dispatch]);

  return { dialogOpen, crq, currentStageId, crqStatus, stageMeta, close, refresh, isRefreshing };
}

/**
 * Pure, hook-free mode resolution (no Redux/RTK Query cost) - called once
 * per stage from the dialog's single top-level subscription instead of each
 * card re-subscribing to the same slice fields independently.
 */
export function resolveCardMode(
  stageId: WorkflowStageId,
  currentStageId: WorkflowStageId | null,
  meta: StageMeta | undefined,
  crqStatus: string,
): StageDialogMode {
  if (crqStatus === "Done") return "view";
  if (stageId === currentStageId) return "edit";
  if (meta?.runState === "completed" || meta?.runState === "failed") return "view";
  return "pending";
}

/** cmsStage enum lookup, reused by both the launcher and each card body. */
export function cmsStageFor(stageId: WorkflowStageId): string {
  return STAGE_ID_TO_ENUM[stageId];
}

// Note: useOpenAttributeUpdate now lives in its own file (useOpenAttributeUpdate.ts,
// re-exported directly by the barrel) so the page that calls it eagerly
// never gets a static import edge into this file's (or the field catalog's)
// heavier dependents.
export { useStageAttributeData } from "./useStageAttributeData";
