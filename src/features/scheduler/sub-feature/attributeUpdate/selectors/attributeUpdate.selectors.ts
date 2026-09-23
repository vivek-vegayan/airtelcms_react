import type { RootState } from "../../../../../app/store";

export const selectAttributeDialogOpen = (state: RootState) =>
  state.attributeUpdate.dialogOpen;
export const selectAttributeCrq = (state: RootState) =>
  state.attributeUpdate.crq;
export const selectAttributeCurrentStageId = (state: RootState) =>
  state.attributeUpdate.currentStageId;
export const selectAttributeCrqStatus = (state: RootState) =>
  state.attributeUpdate.crqStatus;
export const selectAttributeStageMeta = (state: RootState) =>
  state.attributeUpdate.stageMeta;


/**
 * True while any mounted stage card is (re)fetching GET /attributeupdate/details.
 *
 * Read off the RTK Query cache rather than threaded up from the cards: the
 * dialog header has no handle on the per-card queries, and only the cards that
 * are actually open hold a subscription - which is exactly the set a refresh
 * re-pulls.
 */
export const selectAttributeDetailsFetching = (state: RootState) =>
  Object.values(state.api.queries).some(
    (entry) =>
      entry?.endpointName === "getAttributeUpdateDetails" && entry.status === "pending",
  );
