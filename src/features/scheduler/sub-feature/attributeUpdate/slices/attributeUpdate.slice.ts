import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AttributeUpdateCrqContext,
  AttributeUpdateState,
  StageMeta,
} from "../types/attributeUpdate.types";
import type { WorkflowStageId } from "../../../constants/workflowStages";

/**
 * UI-only state for the Attribute Update dialog (which CRQ is open, its
 * current stage + per-stage run-state snapshot). The field catalog is static
 * config (constants/attributeUpdateFieldCatalog.ts) and live attribute
 * values are owned by RTK Query (api/attributeUpdateApiSlice.ts) - neither
 * belongs in this slice. Per-card expand/collapse and remedy-status
 * selection are local component state (multiple stages render at once now),
 * not Redux.
 */
const initialState: AttributeUpdateState = {
  dialogOpen: false,
  crq: null,
  currentStageId: null,
  crqStatus: "",
  stageMeta: {},
};

const attributeUpdateSlice = createSlice({
  name: "attributeUpdate",
  initialState,
  reducers: {
    openAttributeUpdateDialog(
      state,
      action: PayloadAction<{
        crq: AttributeUpdateCrqContext;
        currentStageId: WorkflowStageId;
        crqStatus: string;
        stageMeta: Partial<Record<WorkflowStageId, StageMeta>>;
      }>,
    ) {
      const { crq, currentStageId, crqStatus, stageMeta } = action.payload;
      state.dialogOpen = true;
      state.crq = crq;
      state.currentStageId = currentStageId;
      state.crqStatus = crqStatus;
      state.stageMeta = stageMeta;
    },

    closeAttributeUpdateDialog() {
      return initialState;
    },
  },
});

export const { openAttributeUpdateDialog, closeAttributeUpdateDialog } =
  attributeUpdateSlice.actions;

export default attributeUpdateSlice.reducer;
