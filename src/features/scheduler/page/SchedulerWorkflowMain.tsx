import { useCallback, useState } from "react";
import { Box, useTheme } from "@mui/material";
import { authStorage } from "../../../app/store/auth.storage";
import OrgHierarchyFilters from "../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useApiRefresh, type ApiTag } from "../../../hooks/useApiRefresh";
import { AppStepper } from "../../../components/ui/AppStepper/AppStepper";
import { useStepper } from "../../../hooks/useStepper";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import type { IStep } from "../../../components/ui/AppStepper/types";
import { useTabColorTokens } from "../../../style/theme";
import { PlanAndInventoryPage } from "../components/plan-and-inventory/PlanAndInventoryPage";
import ImpactAnalysisPage from "./ImpactAnalysisPage";
import MopCreatePage from "./MopCreatePage";
import MopValidatePage from "./MopValidatePage";
import SchedulingPage from "./SchedulingPage";
import ActivityImplementPage from "./ActivityImplementPage";
import CloserPage from "./CloserPage";
import { resolveDomainScope } from "../util/orgScope";
import GlobalCrqSearch, {
  type GlobalCrqSearchResolved,
} from "../components/crq-workflow/GlobalCrqSearch";

const WORKFLOW_STEPS: IStep[] = [
  {
    id: 1,
    label: "Plan & inventory",
    icon: <Inventory2OutlinedIcon fontSize="small" />,
  },
  {
    id: 2,
    label: "Impact analysis",
    icon: <MonitorHeartOutlinedIcon fontSize="small" />,
  },
  {
    id: 3,
    label: "MOP creation",
    icon: <NoteAddOutlinedIcon fontSize="small" />,
  },
  {
    id: 4,
    label: "MOP validation",
    icon: <FactCheckOutlinedIcon fontSize="small" />,
  },
  {
    id: 5,
    label: "Scheduling",
    icon: <EditCalendarOutlinedIcon fontSize="small" />,
  },
  { id: 6, label: "Network exec", icon: <WifiOutlinedIcon fontSize="small" /> },
  {
    id: 7,
    label: "Task closure",
    icon: <TaskAltOutlinedIcon fontSize="small" />,
  },
];

// Plan & Inventory reads "CrqReview"; the other six stages read "StageWorkflow".
// Invalidating both refetches whichever stage page is currently mounted, so one
// button in the filter bar serves the whole workflow.
const WORKFLOW_TAGS: ApiTag[] = ["CrqReview", "StageWorkflow"];

export const PlanAndInventoryMain = () => {
  // Existing Hook Logic
  const loggedUser = authStorage.getUser();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";
  const { values, setValues, handleChange } = useOrgHierarchyState("schedulerWorkflow");
  const { options } = useOrgHierarchyFilters(values);
  // A TEAM_MEMBER is never shown a Domain picker (ORG_FILTER_VISIBILITY), so
  // there is no domain to send for them - null, not a defaulted-to-1 guess.
  // Every stage below then queries with the param omitted, which is what the
  // role-aware stage procedures expect: they scope such a caller by their own
  // assignments plus the sub-domain they *can* choose.
  const domainId = resolveDomainScope(roleName, values.domain);
  const theme = useTheme();
  const tk = useTabColorTokens(theme);
  // Initialize Stepper (Setting default to 1 -> "Plan & inventory")
  const { activeStep, goToStep } = useStepper(0, WORKFLOW_STEPS.length);
  const { refresh, isRefreshing } = useApiRefresh({ tags: WORKFLOW_TAGS });

  // CRQ the Global CRQ Search last routed to. Passed to whichever stage page
  // is showing so it lists only that CRQ instead of every CRQ in the plan;
  // undefined during normal navigation, leaving the stages untouched.
  const [focusCrqNo, setFocusCrqNo] = useState<string | undefined>(undefined);

  /**
   * Global CRQ Search landed on a CRQ. Point the org filters at the scope the
   * CRQ actually lives in, then switch to the step matching its real
   * current_stage. Both come from the backend response (see
   * util/crqStageRouting.ts) - nothing here is assumed about the destination.
   *
   * This reuses the same two pieces of state normal navigation already uses -
   * the filter values and the stepper index - so a jump leaves the workflow in
   * exactly the state the user would have reached by picking those filters and
   * that step by hand.
   */
  const handleCrqResolved = useCallback(
    (resolved: GlobalCrqSearchResolved) => {
      setValues(resolved.filters);
      goToStep(resolved.stepIndex);
      setFocusCrqNo(resolved.hit.crqNo);
    },
    [setValues, goToStep],
  );

  /**
   * Manual navigation cancels the search focus. Clicking a different stage, or
   * changing an org filter, is the user deliberately going somewhere else -
   * carrying the previous CRQ's filter into that view would show them an empty
   * stage and look like a bug. Both wrap the existing handlers rather than
   * replacing them, so ordinary navigation is unchanged.
   */
  const handleStepClick = useCallback(
    (stepIndex: number) => {
      setFocusCrqNo(undefined);
      goToStep(stepIndex);
    },
    [goToStep],
  );

  const handleFilterChange = useCallback<typeof handleChange>(
    (key, value) => {
      setFocusCrqNo(undefined);
      handleChange(key, value);
    },
    [handleChange],
  );

  return (
    <Box sx={{ p: { xs: 1, md: 0 } }}>
      {/* Top Stepper Card */}
      {/* Global CRQ Search rides in the filter bar's existing `children` slot,
          so it shares that one row instead of adding another. Additive: the
          filters, stepper and stage pages below are unchanged. */}
      <OrgHierarchyFilters
        role={roleName}
        values={values}
        options={options}
        onChange={handleFilterChange}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
        refreshDisabled={values.subDomain == null}
        refreshTooltip={
          values.subDomain != null
            ? "Refresh this stage"
            : "Pick a Sub Domain first"
        }
      >
        <Box sx={{ ml: "auto", flexShrink: 0 }}>
          <GlobalCrqSearch onResolved={handleCrqResolved} />
        </Box>
      </OrgHierarchyFilters>

      <Box
        sx={{
          // mb: 1.5,
          pt: 2,
          overflow: "auto",
          // border: `1px solid ${tk.accentDim}`,
          borderRadius: tk.radiusL,
          transition: "background .18s, transform .16s",
        }}
      >
        <AppStepper
          // sx={{}}
          steps={WORKFLOW_STEPS}
          activeStep={activeStep}
          onStepClick={handleStepClick}
        />
      </Box>

      {/* {activeStep === 0 && <h1>CRQ Assignment</h1>} */}
      {activeStep === 0 && (
        <PlanAndInventoryPage
          domainId={domainId}
          subDomainId={values.subDomain}
          focusCrqNo={focusCrqNo}
        />
      )}
      {activeStep === 1 && (
        <ImpactAnalysisPage
          domainId={domainId}
          subDomainId={values.subDomain}
          focusCrqNo={focusCrqNo}
        />
      )}
      {activeStep === 2 && (
        <MopCreatePage
          domainId={domainId}
          subDomainId={values.subDomain}
          focusCrqNo={focusCrqNo}
        />
      )}
      {activeStep === 3 && (
        <MopValidatePage
          domainId={domainId}
          subDomainId={values.subDomain}
          focusCrqNo={focusCrqNo}
        />
      )}
      {activeStep === 4 && (
        <SchedulingPage
          domainId={domainId}
          subDomainId={values.subDomain}
          focusCrqNo={focusCrqNo}
        />
      )}
      {activeStep === 5 && (
        <ActivityImplementPage
          domainId={domainId}
          subDomainId={values.subDomain}
          focusCrqNo={focusCrqNo}
        />
      )}
      {activeStep === 6 && (
        <CloserPage
          domainId={domainId}
          subDomainId={values.subDomain}
          focusCrqNo={focusCrqNo}
        />
      )}
    </Box>
  );
};
