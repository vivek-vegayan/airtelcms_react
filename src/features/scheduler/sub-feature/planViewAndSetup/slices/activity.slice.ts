import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PlanViewRow } from "../api/planApiSlice";

interface ActivityState {
  // Plan detail dialog (opened from a row's "Plan Type" cell)
  selectedPlan: PlanViewRow | null;
  planDialogOpen: boolean;
}

const initialState: ActivityState = {
  selectedPlan: null,
  planDialogOpen: false,
};

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    openPlanDialog(state, action: PayloadAction<PlanViewRow>) {
      state.selectedPlan = action.payload;
      state.planDialogOpen = true;
    },

    closePlanDialog(state) {
      state.planDialogOpen = false;
      state.selectedPlan = null;
    },
  },
});

export const { openPlanDialog, closePlanDialog } = activitySlice.actions;

export default activitySlice.reducer;
