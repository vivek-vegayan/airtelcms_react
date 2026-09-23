import { useCallback } from "react";
import { useAppDispatch } from "../../../../../app/hooks";
import type { Crq } from "../../../types/crqWorkflow.types";
import {
  WORKFLOW_STAGES,
  findHistoryEntry,
  resolveCurrentStageIndex,
  resolveStageState,
  type WorkflowStageId,
} from "../../../constants/workflowStages";
import { openAttributeUpdateDialog } from "../slices/attributeUpdate.slice";
import { buildAttributeCrqContext } from "../utils/buildAttributeCrqContext";
import type { StageMeta } from "../types/attributeUpdate.types";

/**
 * Launcher hook for pages hosting the "Attribute Update" action button.
 * Subscribes to no state, so the hosting page never re-renders on dialog
 * interactions — it only dispatches the dialog-open action; live data is
 * fetched reactively by each stage card via RTK Query once open.
 *
 * Always opens the full 7-stage workflow timeline for the CRQ - which stage
 * is editable is derived from the CRQ's own current stage, not from
 * whichever row happened to be selected in the outer cockpit rail.
 *
 * Deliberately its own file, importing only the slice action + small
 * workflowStages/crqWorkflow helpers - not the barrel, not
 * attributeUpdate.utils.ts, not the field catalog. The dialog itself
 * (components/AttributeUpdateDialog) is lazy-loaded from the page that
 * calls this hook; this file is the one part of the sub-feature that page
 * needs eagerly, so it must stay free of any import edge into the
 * catalog-heavy dialog subtree, or that lazy boundary gets defeated.
 */
export function useOpenAttributeUpdate() {
  const dispatch = useAppDispatch();

  return useCallback(
    (crq: Crq) => {
      const context = buildAttributeCrqContext(crq);
      const currentIndex = resolveCurrentStageIndex(crq);
      const currentStageId = WORKFLOW_STAGES[currentIndex]?.id ?? WORKFLOW_STAGES[0].id;

      const stageMeta: Partial<Record<WorkflowStageId, StageMeta>> = {};
      WORKFLOW_STAGES.forEach((stage, idx) => {
        const runState = resolveStageState(crq, idx, currentIndex);
        const entry = findHistoryEntry(crq, stage.id);
        stageMeta[stage.id] = {
          runState,
          status: entry?.status ?? null,
          performedBy: entry?.performedBy ?? entry?.assignedTo ?? null,
          completedAt: entry?.completedAt ?? null,
        };
      });

      dispatch(
        openAttributeUpdateDialog({
          crq: context,
          currentStageId,
          crqStatus: crq.crqStatus,
          stageMeta,
        }),
      );
    },
    [dispatch],
  );
}
