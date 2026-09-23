import { Box } from "@mui/material";
import { useActivity } from "./hooks/useActivity";
import { authStorage } from "../../../../app/store/auth.storage";
import { useOrgHierarchyState } from "../../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../../orgHierarchy/hooks/useOrgHierarchyFilters";
import OrgHierarchyFilters from "../../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { useApiRefresh, type ApiTag } from "../../../../hooks/useApiRefresh";
import { PlanViewTable } from "./components/PlanViewTable";
import { PlanDetailDialog } from "./components/PlanDetailDialog";

// PlanViewTable owns the plan query and the detail dialog owns the phase query;
// both are reached by tag, so the filter bar refreshes the plan list and any
// open phase breakdown in one click.
const PLAN_TAGS: ApiTag[] = ["Plan", "ActivityPhase"];

export const PlanViewAndSetup = () => {
  const { selectedPlan, planDialogOpen, handleClosePlanDialog } = useActivity();

  const loggedUser = authStorage.getUser();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";

  const { values, handleChange } = useOrgHierarchyState("planViewAndSetup");
  const { options } = useOrgHierarchyFilters(values);
  const { refresh, isRefreshing } = useApiRefresh({ tags: PLAN_TAGS });

  return (
    <>
      <Box>
        <OrgHierarchyFilters
          role={roleName}
          values={values}
          options={options}
          onChange={handleChange}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          refreshDisabled={values.subDomain === undefined}
          refreshTooltip={
            values.subDomain === undefined
              ? "Pick a Sub Domain first"
              : "Refresh plans"
          }
        />
      </Box>

      <Box
        sx={{
          position: "relative",
          px: { xs: 1.5, md: 2.5 },
          py: { xs: 1.5, md: 2 },
        }}
      >
        {/* Pass ALL filter values — not just subDomain */}
        <PlanViewTable
          verticalId={values.vertical}
          functionId={values.teamFunction}
          domainId={values.domain}
          subDomainId={values.subDomain}
          chmDomainOptions={options.domain}
          chmSubDomainOptions={options.subDomain}
          selectedChmDomain={values.domain}
          selectedChmSubDomain={values.subDomain}
        />

        <PlanDetailDialog
          open={planDialogOpen}
          plan={selectedPlan}
          onClose={handleClosePlanDialog}
        />
      </Box>
    </>
  );
};

export const ActivityViewAndSetupMain = () => <PlanViewAndSetup />;
