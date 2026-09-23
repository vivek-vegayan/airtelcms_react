import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { api } from "../../../service/api";
import type { StageKey } from "../types/stageWorkflow.types";

/**
 * Re-pulls whatever is currently showing this stage's CRQs.
 *
 * Invalidating the tags rather than calling a specific `refetch` is what lets
 * one callback serve both surfaces that render the review dialog: the stage
 * listing page (`getStageData`, tagged `StageWorkflow`) and the single-CRQ
 * cockpit (tagged `CrqReview`). Whichever query is mounted refetches; the
 * other is a no-op.
 */
export const useStageRefresh = (stageKey: StageKey) => {
  const dispatch = useDispatch();

  return useCallback(() => {
    dispatch(
      api.util.invalidateTags([
        { type: "StageWorkflow" as const, id: stageKey },
        "CrqReview" as const,
      ]),
    );
  }, [dispatch, stageKey]);
};
