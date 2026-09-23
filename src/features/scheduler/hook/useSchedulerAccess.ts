import { useMemo } from "react";
import { usePermission } from "../../../rbac/usePermission";
import { isPathAllowed } from "../../../rbac/routeAccess";

export interface SchedulerAccess {
  /** /scheduler/crqWorkflow — the CRQ Workflow tab and its CRQ detail pages. */
  canViewCrqWorkflow: boolean;
  /** /scheduler/planviewandsetup */
  canViewPlan: boolean;
  /** /scheduler/taskconfig — shares the Plan nav entry's grant. */
  canViewTaskConfig: boolean;
  /** /scheduler/crqjourney */
  canViewCrqJourney: boolean;
  /** /scheduler/cancelledcrq — the read-only Cancelled CRQ register. */
  canViewCancelledCrq: boolean;
  /**
   * Whether the user may perform the Scheduler's mutating actions (start/pause
   * a stage, submit a stage outcome, reschedule, sync plan data, update
   * attributes). A View-only grant leaves this false, which is what turns the
   * workflow into a genuinely read-only view instead of one that merely hides
   * the sidebar entry.
   */
  canEdit: boolean;
}

/**
 * Single source of truth for what a user may reach inside the Scheduler.
 *
 * Visibility is resolved through `isPathAllowed` against the same nav registry
 * that builds the sidebar and backs PrivateRoute, so a tab can never be shown
 * for a page the route guard would then refuse to render — the previous
 * hard-coded <Tab> lists had exactly that failure mode.
 */
export const useSchedulerAccess = (): SchedulerAccess => {
  const { hasModule, hasSubModule, can } = usePermission();

  return useMemo(() => {
    const allows = (path: string) => isPathAllowed(path, hasModule, hasSubModule);

    return {
      canViewCrqWorkflow: allows("/scheduler/crqWorkflow"),
      canViewPlan: allows("/scheduler/planviewandsetup"),
      canViewTaskConfig: allows("/scheduler/taskconfig"),
      canViewCrqJourney: allows("/scheduler/crqjourney"),
      canViewCancelledCrq: allows("/scheduler/cancelledcrq"),
      canEdit: can("Scheduler", "UPDATE"),
    };
  }, [hasModule, hasSubModule, can]);
};
