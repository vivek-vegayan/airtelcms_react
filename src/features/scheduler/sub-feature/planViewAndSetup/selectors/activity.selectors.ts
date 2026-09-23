import type { RootState } from "../../../../../app/store";

export const selectSelectedPlan = (state: RootState) => state.planViewAndSetup.selectedPlan;
export const selectPlanDialogOpen = (state: RootState) => state.planViewAndSetup.planDialogOpen;
