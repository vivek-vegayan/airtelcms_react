import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useAppTable } from "../../../../components/ui/AppTable";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { useTabColorTokens } from "../../../../style/theme";
import CustomActionButton from "../../../../components/common/CustomActionButton";
import FilterSvg from "../../../../assets/svg/Filter.svg";
import { getStageConfig } from "../../constants/stageConfig";
import { useGetStageDataQuery } from "../../api/stageWorkflowApiSlice";
import { StageDetailPanel } from "./StageDetailPanel";
import { useStageWorkflow } from "../../hook/useStageWorkflow";
import { filterPlansBySearch } from "../../util/filterPlansBySearch";
import { filterPlansByChangeImpact, type ChangeImpactFilter } from "../../util/changeImpact";
import ChangeImpactSelect from "./ChangeImpactSelect";
import { injectGlobalStyles } from "../../util/injectGlobalStyles";
import { buildScopeQuery, isOrgScopeReady } from "../../util/orgScope";
import type { StageKey } from "../../types/stageWorkflow.types";
import { usePermission } from "../../../auth/hooks/usePermission";
const RescheduleDialog = lazy(() => import("../crq-workflow/reschedule/RescheduleDialog"));
const StageReviewDialog = lazy(() => import("./dialog/StageReviewDialog"));
const PreviewCrqPdfDialog = lazy(() => import("../dialog/crq-preview/PreviewCrqPdfDialog"));
// Host for the "Attribute Update" button that now lives inside the review
// dialog's form (see dialog/AttributeUpdateGate) - the button only dispatches
// the open action, so the dialog itself has to be mounted by the page.
const AttributeUpdateDialog = lazy(
  () => import("../../sub-feature/attributeUpdate/components/AttributeUpdateDialog"),
);
const RESCHEDULABLE_STAGES = new Set<StageKey>(["scheduling", "activityimplement"]);

/** RBAC module + permission the Reschedule action requires. */
const SCHEDULER_MODULE = "Scheduler";
const UPDATE_PERMISSION = "UPDATE";

interface GenericStagePageProps {
  stageKey: StageKey;
  /**
   * `null` = the caller's role has no domain scope (TEAM_MEMBER/TEAM_LEAD),
   * so the stage is queried with no domainId at all. `undefined` = the role
   * does have a Domain picker but hasn't used it yet. See util/orgScope.ts.
   */
  domainId?: number | null;
  subDomainId?: number;
  /**
   * CRQ number the Global CRQ Search sent the user here for. When set, this
   * page's existing global-search filter is seeded with it so only that CRQ
   * is listed instead of every CRQ in the plan. Undefined during normal
   * navigation, which leaves the page behaving exactly as before.
   */
  focusCrqNo?: string;
}

/**
 * The single page component rendered by every stage route (Impact
 * Analysis, MOP Create, MOP Validate, Scheduling, Activity Implement,
 * Closer, ...). Pass a different `stageKey` and everything - the GET
 * endpoint, start/pause endpoint, done payload shape, status field,
 * outcome options and form fields - resolves automatically from
 * `stageConfig.ts`.
 *
 * This is a direct refactor of the original `PlanAndInventoryPage`,
 * generalized to take a stageKey instead of being hard-wired to Impact
 * Analysis.
 */
export const GenericStagePage: React.FC<GenericStagePageProps> = ({
  stageKey,
  domainId,
  subDomainId,
  focusCrqNo,
}) => {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const stageConfig = getStageConfig(stageKey);

  const { toggleStartPause, submitDone } = useStageWorkflow(stageKey);

  const [plansOriginal, setPlansOriginal] = useState<any[]>([]);
  const [openCrqs, setOpenCrqs] = useState<Record<string, boolean>>({});
  const [selectedCrq, setSelectedCrq] = useState<any | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [globalSearchInput, setGlobalSearchInput] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [changeImpact, setChangeImpact] = useState<ChangeImpactFilter>("");
  const [rescheduleCrq, setRescheduleCrq] = useState<any | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [previewPdfOpen, setPreviewPdfOpen] = useState(false);

  const { hasPermission } = usePermission();
  // One gate for every mutating affordance on this page. Reschedule already
  // honoured it; Start/Pause did not, so a Scheduler VIEW grant used to hand
  // over the ability to drive a stage.
  const canEdit = hasPermission(SCHEDULER_MODULE, UPDATE_PERMISSION);
  const canReschedule = RESCHEDULABLE_STAGES.has(stageKey) && canEdit;

  // A domain-less role (TEAM_MEMBER) is ready as soon as a sub-domain is
  // known - waiting on a Domain it is never offered is what used to leave it
  // stuck on the "select a filter" screen.
  const scopeReady = isOrgScopeReady(domainId, subDomainId);

  useEffect(() => {
    injectGlobalStyles();
  }, []);

  const {
    data: stageData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch: refetchStageData,
  } = useGetStageDataQuery(
    { stageKey, domainId, subDomainId: subDomainId ?? 1 },
    { skip: !scopeReady },
  );

  useEffect(() => {
    if (stageData?.plans) setPlansOriginal(stageData.plans);
  }, [stageData]);

  useEffect(() => {
    const t = setTimeout(() => setGlobalSearch(globalSearchInput), 300);
    return () => clearTimeout(t);
  }, [globalSearchInput]);

  // Arriving from the Global CRQ Search: narrow the listing to just that CRQ.
  // Both the input and the debounced value are set so the filter applies on
  // arrival rather than 300ms later. The user can clear the search box to see
  // the rest of the stage's CRQs again - it is an ordinary search term, not a
  // separate mode.
  useEffect(() => {
    if (!focusCrqNo) return;
    setGlobalSearchInput(focusCrqNo);
    setGlobalSearch(focusCrqNo);
  }, [focusCrqNo]);

  const handleStartPause = async (crq: any) => {
    const result = await toggleStartPause(crq);
    if (!result.success) return;
    setPlansOriginal((prev) =>
      prev.map((plan) => ({
        ...plan,
        crqs: plan.crqs.map((c: any) =>
          c.crqNo === crq.crqNo ? { ...c, [stageConfig.statusField]: result.nextStatus } : c,
        ),
      })),
    );
  };

  /**
   * Review dialog submit ("Pass"/"Failed"/"Cancelled") - mirrors
   * CrqDetailedView's handleSubmitDone so the exact same
   * StageReviewDialog + useStageWorkflow.submitDone flow works whether the
   * CRQ is actioned from this list page or from the single-CRQ cockpit.
   * Patches the row's status locally for an immediate UI flip; the
   * StageWorkflow tag invalidation then refetches the authoritative state.
   */
  const handleSubmitDone = async (values: Record<string, any>, crq: any) => {
    const result = await submitDone(values, crq);
    if (result.success) {
      setPlansOriginal((prev) =>
        prev.map((plan) => ({
          ...plan,
          crqs: plan.crqs.map((c: any) =>
            c.crqNo === crq.crqNo ? { ...c, [stageConfig.statusField]: values.status } : c,
          ),
        })),
      );
    }
    return result;
  };

  const toggleFullScreen = () => {
    const elem = document.getElementById(`${stageKey}-container`);
    if (!document.fullscreenElement) {
      elem?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleCrq = (id: string) => setOpenCrqs((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredPlans = useMemo(
    () => filterPlansByChangeImpact(filterPlansBySearch(plansOriginal, globalSearch), changeImpact),
    [plansOriginal, globalSearch, changeImpact],
  );

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "planNumber",
        header: "Plan Number",
        size: 200,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: colors.accent }}>
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "planType",
        header: "Plan Type",
        size: 180,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<string>()}
            size="small"
            sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: colors.successDim, color: colors.success }}
          />
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 400,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
            {cell.getValue<string>()}
          </Typography>
        ),
      },
    ],
    [colors],
  );

  const renderTopToolbarCustomActions = () => (
    <Stack direction="row" alignItems="center" spacing={1.2} flexWrap="wrap">
      <ChangeImpactSelect value={changeImpact} onChange={setChangeImpact} colors={colors} />
      <TextField
        size="small"
        placeholder={`Search ${stageConfig.label.toLowerCase()} plans, CRQs…`}
        value={globalSearchInput}
        onChange={(e) => setGlobalSearchInput(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ fontSize: 15, color: colors.textDim }} />
            </InputAdornment>
          ),
          sx: { fontSize: 13, height: 34, borderRadius: "9px", bgcolor: colors.trackOff },
        }}
        sx={{ width: 260 }}
      />
      <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
        <IconButton size="small" onClick={toggleFullScreen}>
          {isFullscreen ? <FullscreenExitIcon sx={{ fontSize: 17 }} /> : <FullscreenIcon sx={{ fontSize: 17 }} />}
        </IconButton>
      </Tooltip>

      <CustomActionButton
        label="View Selected CRQ"
        disabled={!selectedCrq}
        url={
          selectedCrq
            ? `${import.meta.env.BASE_URL}scheduler/crqWorkflow/${selectedCrq.crqNo}?${buildScopeQuery(domainId, subDomainId)}`
            : undefined
        }
        colors={colors}
      />
      <CustomActionButton
        label={`Review ${stageConfig.label}`}
        disabled={!selectedCrq}
        onClick={() => setReviewDialogOpen(true)}
        startIcon={<FactCheckRoundedIcon sx={{ fontSize: 16 }} />}
        colors={colors}
      />
      <CustomActionButton
        label="PDF View"
        disabled={!selectedCrq}
        onClick={() => setPreviewPdfOpen(true)}
        startIcon={<PictureAsPdfOutlinedIcon sx={{ fontSize: 16 }} />}
        colors={colors}
      />
      <Stack direction="row" spacing={0.8}>
        <Chip label={`${filteredPlans.length} plans`} size="small" sx={{ height: 24, fontSize: 11, fontWeight: 700 }} />
        <Chip
          label={`${filteredPlans.reduce((a: number, p: any) => a + (p.crqs?.length || 0), 0)} CRQs`}
          size="small"
          sx={{ height: 24, fontSize: 11, fontWeight: 700 }}
        />
      </Stack>
    </Stack>
  );

  const table = useAppTable({
    columns,
    data: filteredPlans,
    enableSorting: true,
    enablePagination: true,
    // Built-in "Search" box replaced by the Change Impact filter above.
    enableGlobalFilter: false,
    renderDetailPanel: ({ row }) => (
      <StageDetailPanel
        plan={row.original}
        stageConfig={stageConfig}
        openCrqs={openCrqs}
        selectedCrq={selectedCrq}
        colors={colors}
        onToggle={toggleCrq}
        onSelect={setSelectedCrq}
        onStartPause={canEdit ? handleStartPause : undefined}
        onReschedule={canReschedule ? setRescheduleCrq : undefined}
      />
    ),
    renderTopToolbarCustomActions,
    initialState: { density: "compact" },
    state: { isLoading: isFetching },
    muiDetailPanelProps: { sx: { padding: 0 } },
    muiTableContainerProps: { sx: { maxHeight: "calc(100vh - 350px)" } },
  });

  if (!scopeReady) {
    return (
      <Box sx={{ width: "100%", minHeight: "calc(100vh - 220px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={FilterSvg} alt="Select Filter" width={850} />
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">Loading {stageConfig.label}…</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box id={`${stageKey}-container`} sx={{ p: { xs: 1.5, sm: 2, md: 1 }, minHeight: "100%" }}>
        <Typography color="error">
          An error occurred while fetching {stageConfig.label} data. {(error as any)?.error || "Please retry."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box id={`${stageKey}-container`} sx={{ p: { xs: 1.5, sm: 2, md: 1 }, minHeight: "100%" }}>
      <MaterialReactTable table={table} />

      {/* Exact same wizard the CRQ cockpit opens - mounted only once a card's
          Reschedule is clicked, so its chunk is fetched on demand. */}
      {rescheduleCrq && (
        <Suspense fallback={null}>
          <RescheduleDialog
            open={!!rescheduleCrq}
            onClose={() => setRescheduleCrq(null)}
            crqId={rescheduleCrq.crqId ?? null}
            crqNo={rescheduleCrq.crqNo ?? null}
            colors={colors}
            activityPlanStartDate={rescheduleCrq.activityPlanStartDate ?? null}
            activityPlanEndDate={rescheduleCrq.activityPlanEndDate ?? null}
            onCompleted={refetchStageData}
          />
        </Suspense>
      )}
      {/* Same review dialog the CRQ cockpit renders for this stage - lets a
          user Pass/Fail/Cancel the selected CRQ's outcome without leaving
          this list, exactly like the original "Impact Analysis" button on
          the reference list page. Mounted only once opened, so its chunk is
          fetched on demand. */}
      {reviewDialogOpen && selectedCrq && (
        <Suspense fallback={null}>
          <StageReviewDialog
            open={reviewDialogOpen}
            onClose={() => setReviewDialogOpen(false)}
            crq={selectedCrq}
            colors={colors}
            stageConfig={stageConfig}
            onSubmitDone={handleSubmitDone}
          />
          <AttributeUpdateDialog />
        </Suspense>
      )}
      {/* Same "Preview CRQ" plan PDF the single-CRQ cockpit renders, opened
          for whichever CRQ is checked in this list - matches the reference
          list page's "Preview Plan" action. Mounted only once opened. */}
      {previewPdfOpen && selectedCrq && (
        <Suspense fallback={null}>
          <PreviewCrqPdfDialog
            open={previewPdfOpen}
            onClose={() => setPreviewPdfOpen(false)}
            crqNo={selectedCrq.crqNo ?? null}
            colors={colors}
          />
        </Suspense>
      )}
    </Box>
  );
};

export default GenericStagePage;
