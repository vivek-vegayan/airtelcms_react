import { useMemo, useState } from "react";
import { useAppSelector } from "../../../../../app/hooks";
import { STAGE_ID_TO_ENUM, type WorkflowStageId } from "../../../constants/workflowStages";
import { findRemedyStatusFloor, resolveStageView } from "../utils/attributeUpdate.utils";
import { useGetAttributeUpdateDetailsQuery } from "../api/attributeUpdateApiSlice";

/**
 * Live attribute data for one stage card - only ever called from
 * WorkflowStageCardBody, which itself only mounts once a card is actually
 * open (the current/editable stage immediately, any other stage once the
 * user expands it). Mounting *is* the lazy-load gate here: no skipToken
 * bookkeeping needed since this hook simply isn't instantiated for
 * collapsed/pending cards, so there is no query, no resolveStageView
 * mapping, and no react-hook-form instance paid for up front.
 */
export function useStageAttributeData(stageId: WorkflowStageId, crqNo: string) {
  const cmsStage = STAGE_ID_TO_ENUM[stageId];
  // null = "the user hasn't picked a sub-status yet", which is not the same as
  // picking the first one: while it is null the bar simply sits on wherever the
  // CRQ actually is, and follows it if the fetch resolves late or a save moves
  // it on. Storing 0 up front would instead show "Scheduled For Review" for a
  // CRQ already in progress until the response landed.
  const [selectedStatusIndex, setSelectedStatusIndex] = useState<number | null>(null);

  // Stamped into the "...Done By" / "...Executed By" fields: whoever is signed
  // in is who performed the step, so those are auto-set rather than typed.
  const currentUserOlmId = useAppSelector((s) => s.auth.user?.olmId ?? "");

  const {
    data: details,
    isFetching,
    error: queryError,
  } = useGetAttributeUpdateDetailsQuery({ crqNo, cmsStage });

  // The status the CRQ is actually in. Statuses before it are history, so the
  // bar can start here and move on, never back - a CRQ that reached "Scheduled"
  // must not be walked back to "Scheduled For Review" by reopening the dialog.
  const remedyStatusFloor = findRemedyStatusFloor(stageId, details?.remedyStatus);

  // Clamped rather than merely defaulted, so a save that advances the CRQ drags
  // a now-stale selection forward with it on the refetch instead of leaving the
  // card sitting on a status the CRQ has already left.
  const remedyStatusIndex = Math.max(selectedStatusIndex ?? remedyStatusFloor, remedyStatusFloor);

  const stageView = useMemo(
    () => resolveStageView(stageId, remedyStatusIndex, details, crqNo, currentUserOlmId),
    [stageId, remedyStatusIndex, details, crqNo, currentUserOlmId],
  );

  return {
    cmsStage,
    isLoading: isFetching,
    error: queryError ? "Failed to load attribute details." : null,
    stageView,
    remedyStatusIndex,
    /** First selectable sub-status - everything before it is already passed. */
    remedyStatusFloor,
    setRemedyStatusIndex: setSelectedStatusIndex,
  };
}
