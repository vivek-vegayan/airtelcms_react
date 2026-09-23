import { useCallback } from "react";
import { openPlanDialog, closePlanDialog } from "../slices/activity.slice";
import { selectSelectedPlan, selectPlanDialogOpen } from "../selectors/activity.selectors";
import { useAppDispatch, useAppSelector } from "../../../../../app/hooks";
import type { PlanViewRow } from "../api/planApiSlice";

export const useActivity = () => {
  const dispatch = useAppDispatch();

  const selectedPlan = useAppSelector(selectSelectedPlan);
  const planDialogOpen = useAppSelector(selectPlanDialogOpen);

  const handleOpenPlanDialog = useCallback(
    (plan: PlanViewRow) => dispatch(openPlanDialog(plan)),
    [dispatch],
  );

  const handleClosePlanDialog = useCallback(
    () => dispatch(closePlanDialog()),
    [dispatch],
  );

  return {
    selectedPlan,
    planDialogOpen,
    handleOpenPlanDialog,
    handleClosePlanDialog,
  };
};
