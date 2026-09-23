import React, { Suspense, lazy, useCallback, useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import FilterSvg from "../../../../assets/svg/Filter.svg";

import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  TextField,
  Chip,
  InputAdornment,
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
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";

import { useTabColorTokens } from "../../../../style/theme";
import type { RootState } from "../../../../app/store";
import type { Plan } from "../../types/crqWorkflow.types";
import { deepSearch } from "../../util/stringUtils";
import { taskNumbersOf } from "../../constants/stageConfig";
import { filterPlansByChangeImpact, type ChangeImpactFilter } from "../../util/changeImpact";
import ChangeImpactSelect from "../generic/ChangeImpactSelect";
import { CrqCard } from "./CrqCard";
import CustomActionButton from "../../../../components/common/CustomActionButton";
import { injectGlobalStyles } from "../../util/injectGlobalStyles";
import { buildScopeQuery, isOrgScopeReady } from "../../util/orgScope";
import {
  useGetCrqReviewQuery,
  useUpdateCrqReviewStatusMutation,
  useSubmitCrqReviewDoneMutation,
} from "../../api/crqreviewApiSlice";

// Same on-demand chunks GenericStagePage uses for its "Review"/"Preview Plan"
// actions - only fetched once the corresponding button is actually clicked.
const PlanInvDialog = lazy(() => import("../dialog/plan-inv-preview/PlanInvDialog"));
const PreviewCrqPdfDialog = lazy(() => import("../dialog/crq-preview/PreviewCrqPdfDialog"));
// Host for the "Attribute Update" button that now lives inside the review
// dialog's form (see generic/dialog/AttributeUpdateGate) - the button only
// dispatches the open action, so the dialog itself has to be mounted here.
const AttributeUpdateDialog = lazy(
  () => import("../../sub-feature/attributeUpdate/components/AttributeUpdateDialog"),
);

interface PlanAndInventoryPageProps {
  /**
   * `null` = the caller's role has no domain scope (TEAM_MEMBER/TEAM_LEAD),
   * so the review is queried with no domainId at all. `undefined` = the role
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

type Colors = ReturnType<typeof useTabColorTokens>;

interface DetailPanelProps {
  plan: any;
  openCrqs: Record<string, boolean>;
  selectedCrq: any;
  colors: Colors;
  onToggle: (id: string) => void;
  onSelect: (crq: any) => void;
  onStartPause: (crq: any) => void;
}
const DetailPanel: React.FC<DetailPanelProps> = ({
  plan,
  openCrqs,
  selectedCrq,
  colors,
  onToggle,
  onSelect,
  onStartPause,
}) => (
  <Box
    sx={{
      width: "100%",
      p: 2,
      bgcolor: colors.accentDim,
      borderTop: `1px solid ${colors.border}`,
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.8 }}>
      <Box
        sx={{
          width: 3,
          height: 16,
          borderRadius: 99,
          background: `linear-gradient(180deg, ${colors.accent}, ${colors.info})`,
        }}
      />
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.55,
          color: colors.textSecondary,
          textTransform: "uppercase",
        }}
      >
        CRQs
      </Typography>
      <Chip
        label={plan.crqs?.length ?? 0}
        size="small"
        sx={{
          height: 20,
          fontSize: 11,
          fontWeight: 800,
          bgcolor: colors.accentDim,
          color: colors.accent,
          border: `1px solid ${colors.accentBorder}`,
        }}
      />
      <Typography
        sx={{ fontSize: 12, color: colors.textDim, fontFamily: "monospace" }}
      >
        › {plan.planNumber}
      </Typography>
    </Stack>

    {!plan.crqs?.length ? (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          border: `1px dashed ${colors.border}`,
          borderRadius: colors.radiusL,
        }}
      >
        <TableRowsRoundedIcon
          sx={{ fontSize: 28, mb: 1, color: colors.textDim, opacity: 0.5 }}
        />
        <Typography sx={{ fontSize: 13, color: colors.textDim }}>
          No CRQs found.
        </Typography>
      </Box>
    ) : (
      plan.crqs.map((crq: any) => (
        <CrqCard
          key={crq.crqNo}
          crq={crq}
          plan={plan}
          colors={colors}
          isOpen={!!openCrqs[crq.crqNo]}
          isSelected={selectedCrq?.crqNo === crq.crqNo}
          onToggle={() => onToggle(crq.crqNo)}
          onSelect={() =>
            onSelect(
              selectedCrq?.crqNo === crq.crqNo
                ? null
                : { ...crq, planNumber: plan.planNumber },
            )
          }
          onStartPause={() => onStartPause(crq)}
        />
      ))
    )}
  </Box>
);

export const PlanAndInventoryPage: React.FC<PlanAndInventoryPageProps> = ({
  domainId,
  subDomainId,
  focusCrqNo,
}) => {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const [updateCrqReviewStatus] = useUpdateCrqReviewStatusMutation();
  const [submitCrqReviewDone] = useSubmitCrqReviewDoneMutation();
  const [plansOriginal, setPlansOriginal] = useState<Plan[]>([]);
  const [openCrqs, setOpenCrqs] = useState<Record<string, boolean>>({});
  const [selectedCrq, setSelectedCrq] = useState<any | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [globalSearchInput, setGlobalSearchInput] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [changeImpact, setChangeImpact] = useState<ChangeImpactFilter>("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [previewPdfOpen, setPreviewPdfOpen] = useState(false);

  const currentUserOlmId = useSelector((state: RootState) => state.auth.user?.olmId);

  // A domain-less role (TEAM_MEMBER) is ready as soon as a sub-domain is
  // known - waiting on a Domain it is never offered is what used to leave it
  // stuck on the "select a filter" screen.
  const scopeReady = isOrgScopeReady(domainId, subDomainId);

  useEffect(() => {
    injectGlobalStyles();
  }, []);

  const {
    data: reviewData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetCrqReviewQuery(
    {
      domainId,
      subDomainId: subDomainId ?? 1,
    },
    {
      skip: !scopeReady,
    },
  );

  useEffect(() => {
    if (reviewData?.plans) {
      setPlansOriginal(reviewData.plans);
    }
  }, [reviewData]);

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

  const handleStartPauseReview = useCallback(
    async (crq: any) => {
      try {
        const isRunning = crq.crqReviewStatus === "In Progress";
        const action = isRunning ? "pause" : "start";

        // Call the Plan & Inventory (VALIDATE) start/pause endpoint
        const response = await updateCrqReviewStatus({
          crqNo: crq.crqNo,
          crqId: crq.crqId,
          action,
        }).unwrap();

        // Show success toast
        toast.success(response?.message || "Updated successfully.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Update local state (the tag invalidation refetches from DB too)
        setPlansOriginal((prev) =>
          prev.map((plan) => ({
            ...plan,
            crqs: plan.crqs.map((c) =>
              c.crqNo === crq.crqNo
                ? {
                    ...c,
                    crqReviewStatus: isRunning ? "Paused" : "In Progress",
                    crqStatus: isRunning ? "Paused" : "In Progress",
                  }
                : c,
            ),
          })),
        );
      } catch (error) {
        console.error("Failed to update review status:", error);
        toast.error(
          (error as any)?.data?.message ||
            "Failed to update status. Please try again.",
        );
      }
    },
    [updateCrqReviewStatus],
  );

  /**
   * Plan & Inventory review submit -> /crqworkflow/updatecrqreview/done.
   * Mirrors CrqDetailedView's handleReviewSubmit so the exact same
   * PlanInvDialog + payload shape works whether the CRQ is actioned from
   * this list page or from the single-CRQ cockpit.
   */
  const handleReviewSubmit = useCallback(
    async (data: any) => {
      try {
        const isCanceled = data.status === "canceled";
        const response = await submitCrqReviewDone({
          crqNo: data.crqNo,
          crqId: data.crqId,
          olmId: currentUserOlmId ?? "",
          localStatus: isCanceled
            ? (data.field1 ?? "Cancelled")
            : data.status === "Done"
              ? "DONE"
              : data.status,
          remark: isCanceled ? (data.field5 ?? "") : (data.remark ?? ""),
          planNumber: data.planNumber ?? selectedCrq?.planNumber ?? "",
          taskNumber: taskNumbersOf(selectedCrq),
          ...(isCanceled && {
            cygnetStatus: data.cygnetStatus,
            field1: data.field1,
            field3: data.cancellationReason,
            field4: data.field4,
            field5: data.field5,
          }),
        }).unwrap();
        toast.success(response?.message || `Review for ${data.crqNo} submitted.`);
        return { success: true };
      } catch (err) {
        toast.error((err as any)?.data?.message || "Review submission failed. Please try again.");
        return { success: false };
      }
    },
    [submitCrqReviewDone, currentUserOlmId, selectedCrq],
  );

  const toggleFullScreen = () => {
    const elem = document.getElementById("planning-container");
    if (!document.fullscreenElement) {
      elem?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleCrq = (id: string) =>
    setOpenCrqs((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredPlans = useMemo(() => {
    let plans: any[] = plansOriginal;
    if (globalSearch) {
      const g = globalSearch.trim();
      plans = plansOriginal
        .map((plan: any) => {
          const match = deepSearch(plan, g);
          const crqs = (plan.crqs || []).filter((c: any) => deepSearch(c, g));
          if (!match && !crqs.length) return null;
          return { ...plan, crqs: g ? crqs : plan.crqs };
        })
        .filter(Boolean);
    }
    return filterPlansByChangeImpact(plans, changeImpact);
  }, [plansOriginal, globalSearch, changeImpact]);

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "planNumber",
        header: "Plan Number",
        size: 200,
        Cell: ({ cell }) => (
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 800,
              fontFamily: "monospace",
              color: colors.accent,
              letterSpacing: 0.4,
            }}
          >
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
            sx={{
              height: 20,
              fontSize: 11,
              fontWeight: 600,
              bgcolor: colors.successDim,
              color: colors.success,
              border: `1px solid ${colors.successBorder}`,
            }}
          />
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 400,
        Cell: ({ cell }) => (
          <Typography
            sx={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}
          >
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
        placeholder="Search plans, CRQs, tasks…"
        value={globalSearchInput}
        onChange={(e) => setGlobalSearchInput(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ fontSize: 15, color: colors.textDim }} />
            </InputAdornment>
          ),
          sx: {
            fontSize: 13,
            height: 34,
            borderRadius: "9px",
            bgcolor: colors.trackOff,
            color: colors.textPrimary,
            "& fieldset": { borderColor: colors.border },
            "&:hover fieldset": {
              borderColor: `${colors.accentBorder} !important`,
            },
            "&.Mui-focused fieldset": {
              borderColor: `${colors.accent} !important`,
              borderWidth: "1.5px !important",
            },
            "& input::placeholder": { color: colors.textDim, opacity: 1 },
          },
        }}
        sx={{ width: 260 }}
      />
      <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
        <IconButton
          size="small"
          onClick={toggleFullScreen}
          sx={{
            width: 34,
            height: 34,
            borderRadius: "9px",
            bgcolor: colors.trackOff,
            color: colors.textSecondary,
            border: `1px solid ${colors.border}`,
            transition: "all 0.15s ease",
            "&:hover": {
              bgcolor: colors.accentDim,
              color: colors.accent,
              borderColor: colors.accentBorder,
            },
          }}
        >
          {isFullscreen ? (
            <FullscreenExitIcon sx={{ fontSize: 17 }} />
          ) : (
            <FullscreenIcon sx={{ fontSize: 17 }} />
          )}
        </IconButton>
      </Tooltip>

      {/* Button opens route in a new tab */}
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
        label="Review Plan & Inventory"
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
        <Chip
          label={`${filteredPlans.length} plans`}
          size="small"
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 700,
            bgcolor: colors.accentDim,
            color: colors.accent,
            border: `1px solid ${colors.accentBorder}`,
          }}
        />
        <Chip
          label={`${filteredPlans.reduce((a: number, p: any) => a + (p.crqs?.length || 0), 0)} CRQs`}
          size="small"
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 700,
            bgcolor: colors.infoDim,
            color: colors.info,
            border: `1px solid ${colors.infoBorder}`,
          }}
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
      <DetailPanel
        plan={row.original}
        openCrqs={openCrqs}
        selectedCrq={selectedCrq}
        colors={colors}
        onToggle={toggleCrq}
        onSelect={setSelectedCrq}
        onStartPause={handleStartPauseReview}
      />
    ),
    renderTopToolbarCustomActions,
    initialState: { density: "compact" },
    state: { isLoading: isFetching },
    muiDetailPanelProps: { sx: { padding: 0 } },
    muiTableBodyRowProps: {
      sx: {
        transition: "background 0.12s ease",
        cursor: "pointer",
        "&:hover td": {
          bgcolor: colors.isDark
            ? "rgba(99,102,241,0.04)"
            : "rgba(99,102,241,0.025)",
        },
      },
    },
    muiTopToolbarProps: {
      sx: {
        bgcolor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        px: 2,
        py: 1,
        minHeight: 52,
      },
    },
    muiTableContainerProps: {
      className: "plan-table-scroll",
      sx: {
        maxHeight: "calc(100vh - 350px)",
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: colors.isDark ? "#1F2937" : "#CBD5E1",
        },
      },
    },
  });

  if (!scopeReady) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: "calc(100vh - 220px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <img src={FilterSvg} alt="Select Filter" width={850} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box
        id="planning-container"
        sx={{ p: { xs: 1.5, sm: 2, md: 1 }, minHeight: "100%" }}
      >
        <Typography color="error">
          An error occurred while fetching Plan &amp; Inventory data.{" "}
          {(error as any)?.error || "Please retry."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      id="planning-container"
      sx={{ p: { xs: 1.5, sm: 2, md: 1 }, minHeight: "100%" }}
    >
      <MaterialReactTable table={table} />

      {/* Same review dialog the CRQ cockpit renders for this stage - lets a
          user Pass/Fail/Cancel the selected CRQ's review without leaving
          this list, matching the "Review {stage}" action every other stage's
          GenericStagePage exposes. Mounted only once opened. */}
      {reviewDialogOpen && selectedCrq && (
        <Suspense fallback={null}>
          <PlanInvDialog
            open={reviewDialogOpen}
            onClose={() => setReviewDialogOpen(false)}
            crq={selectedCrq}
            colors={colors}
            onSubmit={handleReviewSubmit}
          />
          <AttributeUpdateDialog />
        </Suspense>
      )}
      {/* Same "Preview CRQ" plan PDF the single-CRQ cockpit renders, matching
          the "Preview Plan" action every other stage's GenericStagePage
          exposes. Mounted only once opened. */}
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

export default PlanAndInventoryPage;
