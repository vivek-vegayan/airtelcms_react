import { STAGE_ENUM_TO_ID, WORKFLOW_STAGES } from "../../../constants/workflowStages";

/**
 * CRQ_MASTER_TBL.current_stage enum -> the label the rest of the cockpit
 * already shows for that stage (StageRail, sidebar, action panel), so the
 * wizard never invents a second name for the same stage. Falls back to the raw
 * enum if a new stage is added to the database before the frontend map.
 */
export const stageLabel = (stageEnum: string | null | undefined): string => {
  if (!stageEnum) return "—";
  const id = STAGE_ENUM_TO_ID[stageEnum];
  return WORKFLOW_STAGES.find((s) => s.id === id)?.label ?? stageEnum;
};
