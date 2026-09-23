import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Box, Button, GlobalStyles, IconButton, Skeleton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FindInPageRoundedIcon from "@mui/icons-material/FindInPageRounded";
import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { useTabColorTokens } from "../../../../style/theme";
import { usePermission } from "../../../auth/hooks/usePermission";

import {
  useGetCrqWorkflowOverviewPagedQuery,
  useGetCrqWorkflowOverviewByCrqNoQuery,
  useSubmitCrqReviewDoneMutation,
  useUpdateCrqReviewStatusMutation,
} from "../../api/crqreviewApiSlice";
import { getStageConfig, taskNumbersOf } from "../../constants/stageConfig";
import { useStageWorkflow } from "../../hook/useStageWorkflow";
import type { Crq } from "../../types/crqWorkflow.types";
import type { StageKey } from "../../types/stageWorkflow.types";
import type { RootState } from "../../../../app/store";
import { authStorage } from "../../../../app/store/auth.storage";
import { resolveDomainScope } from "../../util/orgScope";
import {
  WORKFLOW_STAGES,
  classifyStatusValue,
  isCanceledStatus,
  getStageSummaryFields,
  resolveCurrentStageIndex,
  type WorkflowStageId,
} from "../../constants/workflowStages";

import { CrqWorkflowSidebar } from "../crq-workflow/CrqWorkflowSidebar";
import { CrqWorkflowHeader } from "../crq-workflow/CrqWorkflowHeader";
import { StageRail } from "../crq-workflow/StageRail";
import { CrqActionPanel, type StageMode, type CRQAction } from "../crq-workflow/CrqActionPanel";
import { StageSummaryGrid } from "../crq-workflow/StageSummaryGrid";
import { CrqHistoryTable } from "../crq-workflow/CrqHistoryTable";

import { PlanInvDialog } from "../dialog/plan-inv-preview/PlanInvDialog";
import { StageReviewDialog } from "../generic/dialog/StageReviewDialog";
import { PrevCrqStatusDialog } from "../dialog/impact/PrevCrqStatusDialog";
import { PreviewCrqPdfDialog } from "../dialog/crq-preview/PreviewCrqPdfDialog";

const AttributeUpdateDialog = lazy(
  () => import("../../sub-feature/attributeUpdate/components/AttributeUpdateDialog"),
);

// Same reasoning as AttributeUpdateDialog: the wizard pulls in its own calendar
// grid, five step components and RTK Query endpoints, none of which are needed
// until someone actually clicks Reschedule.
const RescheduleDialog = lazy(() => import("../crq-workflow/reschedule/RescheduleDialog"));

// Same reasoning again: the Validate dialog carries its own form state hook and
// RTK Query endpoints, needed only once someone clicks Validate on the
// Plan & Inventory stage.
const ValidateDialog = lazy(() => import("../crq-workflow/validate/ValidateDialog"));

/**
 * Stages that expose the Reschedule action. Scheduling and Network Execution
 * (Activity Implement) are the only two where the CRQ already has an engineer
 * slot reserved - on earlier stages there is no reservation to move, and on
 * Task Closure the procedures refuse outright ("CRQ is already closed").
 */
const RESCHEDULABLE_STAGES = new Set<WorkflowStageId>(["scheduling", "activityimplement"]);

/** RBAC module + permission the Reschedule action requires (WEB_MODULE / WEB_PERMISSION). */
const SCHEDULER_MODULE = "Scheduler";
const UPDATE_PERMISSION = "UPDATE";

const GlobalStyleBlock = (
  <GlobalStyles
    styles={{
      ".expand-chevron": {
        transition: "transform 0.22s cubic-bezier(.4,0,.2,1)",
        display: "flex",
      },
      ".expand-chevron.open": { transform: "rotate(90deg)" },
      "@keyframes pulseDot": {
        "0%, 100%": { opacity: 1, transform: "scale(1)" },
        "50%": { opacity: 0.4, transform: "scale(0.8)" },
      },
      ".status-pulse-dot": { animation: "pulseDot 1.4s ease-in-out infinite" },
    }}
  />
);

/** Placeholder shown while the selected CRQ's detail query is in flight -
 * mirrors the real layout's shape (header strip, stage rail, a couple of
 * field cards) instead of a bare loading string. */
const CockpitSkeleton: React.FC<{ colors: ReturnType<typeof useTabColorTokens> }> = ({ colors }) => (
  <Box sx={{ flex: 1, p: 2 }}>
    <Skeleton variant="rounded" height={52} sx={{ borderRadius: colors.radius, mb: 1 }} />
    <Stack direction="row" spacing={0.75} sx={{ mb: 1.5 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" width={128} height={54} sx={{ borderRadius: colors.radius }} />
      ))}
    </Stack>
    <Skeleton variant="rounded" height={40} sx={{ borderRadius: colors.radius, mb: 1.5 }} />
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} variant="rounded" height={44} sx={{ borderRadius: colors.radius, mb: 1 }} />
    ))}
  </Box>
);

/**
 * Single-CRQ workflow cockpit at /scheduler/crqWorkflow/:crqNo. Reuses the
 * exact same data + mutations as the list pages (useGetCrqReviewQuery,
 * useUpdateCrqReviewStatusMutation for the Plan & Inventory / Review
 * stage, useStageWorkflow + STAGE_CONFIG_MAP for the other six) and the
 * exact same dialogs (PlanInvDialog, StageReviewDialog, PrevCrqStatusDialog)
 * - only the surrounding navigation (sidebar tree + stage rail) is new.
 *
 * The CRQ list (sidebar) and the selected CRQ's detail (header/rail/summary/
 * history) are two independent RTK Query calls: a paginated/searchable
 * overview feeds the sidebar, and a dedicated by-crq-no lookup hydrates the
 * main panel - so selecting a CRQ never re-fetches or re-renders the list,
 * and the list never needs to contain every CRQ just so the current one can
 * be found in it.
 */
export const CrqDetailedView: React.FC = () => {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const navigate = useNavigate();
  const { crqNo } = useParams<{ crqNo: string }>();
  const [searchParams] = useSearchParams();

  // Same org-hierarchy scope (Vertical/Domain/Sub-domain) the list pages
  // (PlanAndInventoryPage / ImpactAnalysisPage / GenericStagePage) receive
  // as props - here it arrives via query params since this route is
  // reached directly (deep link / new tab), not nested under those pages.
  // Falls back to 1/1 to preserve the previous hardcoded default when a
  // link doesn't carry them (e.g. an old bookmark).
  //
  // For a role with no domain scope (TEAM_MEMBER/TEAM_LEAD) the scope is
  // resolved to null instead: no Domain is ever picked for them upstream, so
  // there is no domainId in the link and none to send. The role decides this
  // rather than the link's contents, so an old bookmark carrying a stale
  // domainId can't smuggle a scope such a user was never given.
  const roleCode = useMemo(() => authStorage.getUser()?.roleCode, []);
  const domainId = resolveDomainScope(
    roleCode,
    Number(searchParams.get("domainId")) || 1,
  );
  const subDomainId = Number(searchParams.get("subDomainId")) || 1;

  const [expPlans, setExpPlans] = useState<Record<string, boolean>>({});
  const [expCrqs, setExpCrqs] = useState<Record<string, boolean>>({});
  const [selectedCrqNo, setSelectedCrqNo] = useState<string | null>(crqNo ?? null);
  const [selectedStageId, setSelectedStageId] = useState<WorkflowStageId>("review");
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  const [globalSearchInput, setGlobalSearchInput] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Collapsed on arrival whenever the route already names a CRQ - that is the
  // "View Selected CRQ" new-tab flow, where the tab exists to show this one
  // CRQ, so the cockpit gets the full width until the user asks for the list.
  // Without a crqNo there is nothing to show but the list, so it starts open.
  // After that it is purely the user's toggle: selecting a CRQ from the list
  // must never change whether the list is shown.
  const [crqListVisible, setCrqListVisible] = useState(() => !crqNo);
  // The list's paged overview query is far heavier than the single-CRQ
  // lookup, so it stays unsubscribed until the list is opened for the first
  // time. Once requested it stays subscribed, so re-opening costs no refetch.
  const [listRequested, setListRequested] = useState(() => !crqNo);

  const handleToggleCrqList = useCallback(() => {
    setListRequested(true);
    setCrqListVisible((v) => !v);
  }, []);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [prevCrqStatusOpen, setPrevCrqStatusOpen] = useState(false);
  const [prevCrqData, setPrevCrqData] = useState<any | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [previewPdfOpen, setPreviewPdfOpen] = useState(false);
  const [previewPdfCrqNo, setPreviewPdfCrqNo] = useState<string | null>(null);

  const { hasPermission } = usePermission();
  // One gate for every mutating affordance on this screen. Reschedule already
  // honoured it; Sync Plan Data, Attribute Update and the stage's Start/Pause
  // did not, so a Scheduler VIEW grant used to hand over full write access.
  const canEdit = hasPermission(SCHEDULER_MODULE, UPDATE_PERMISSION);
  const canReschedule = canEdit;
  const currentUserOlmId = useSelector((state: RootState) => state.auth.user?.olmId);

  // Paginated/searchable list feeding the sidebar - never loads more than
  // one page of CRQs at a time, however large the domain/sub-domain scope is.
  // Skipped until the user actually opens the list (see listRequested).
  const {
    data: pagedData,
    isLoading: isPagedLoading,
    isFetching: isPagedFetching,
    isError: isPagedError,
    error: pagedError,
  } = useGetCrqWorkflowOverviewPagedQuery(
    { domainId, subDomainId, search: globalSearch, page, size: pageSize },
    { skip: !listRequested },
  );

  // Dedicated single-CRQ lookup hydrating the main panel - independent of
  // whichever page of the list is currently showing, and cached per crqNo
  // so re-selecting an already-fetched CRQ costs no network call.
  const {
    data: selectedCrqData,
    isFetching: isSelectedCrqFetching,
    isError: isSelectedCrqError,
    refetch: refetchSelectedCrq,
  } = useGetCrqWorkflowOverviewByCrqNoQuery(
    { domainId, subDomainId, crqNo: selectedCrqNo ?? "" },
    { skip: !selectedCrqNo },
  );

  const [updateCrqReviewStatus] = useUpdateCrqReviewStatusMutation();
  const [submitCrqReviewDone] = useSubmitCrqReviewDoneMutation();

  // One useStageWorkflow instance per generic stage key - hooks must be
  // called unconditionally, so all six are created up front and the active
  // one is picked by selectedStageId when an action fires.
  const impactanalysis = useStageWorkflow("impactanalysis");
  const mopcreate = useStageWorkflow("mopcreate");
  const mopvalidate = useStageWorkflow("mopvalidate");
  const scheduling = useStageWorkflow("scheduling");
  const activityimplement = useStageWorkflow("activityimplement");
  const closer = useStageWorkflow("closer");
  const stageWorkflows: Record<StageKey, ReturnType<typeof useStageWorkflow>> = {
    impactanalysis,
    mopcreate,
    mopvalidate,
    scheduling,
    activityimplement,
    closer,
  };

  useEffect(() => {
    const t = setTimeout(() => setGlobalSearch(globalSearchInput), 300);
    return () => clearTimeout(t);
  }, [globalSearchInput]);

  // A new search term invalidates whatever page the user was on.
  useEffect(() => {
    setPage(0);
  }, [globalSearch]);

  useEffect(() => {
    setSelectedCrqNo(crqNo ?? null);
  }, [crqNo]);

  const selectedPlan = selectedCrqData?.plans?.[0] ?? null;
  const selectedCrq = selectedPlan?.crqs?.[0] ?? null;
  const currentStageIndex = useMemo(() => resolveCurrentStageIndex(selectedCrq), [selectedCrq]);
  const selectedStageIndex = useMemo(
    () => Math.max(0, WORKFLOW_STAGES.findIndex((s) => s.id === selectedStageId)),
    [selectedStageId],
  );
  const stageMode: StageMode =
    selectedStageIndex === currentStageIndex ? "editable" : selectedStageIndex < currentStageIndex ? "view" : "locked";

  // Whole CRQ (not just the selected stage) already closed out - record-level
  // actions that mutate or re-open the CRQ (Attribute Update, CRQ Details) no
  // longer make sense once there's nothing left to act on. The Review action
  // stays enabled so the recorded outcome can still be inspected; the dialog
  // it opens locks its own fields via the same check (see PlanInvDialog /
  // StageReviewDialog's isDone).
  const isCrqDone = classifyStatusValue(selectedCrq?.crqStatus) === "completed";

  const isReviewStage = selectedStageId === "review";
  const activeStageWorkflow = !isReviewStage ? stageWorkflows[selectedStageId as StageKey] : null;
  // Live status of the selected stage: the history entry (authoritative,
  // fed by CRQ_MASTER_TBL) first, legacy per-stage status field as fallback.
  const selectedStageEntry =
    selectedCrq?.history?.find((h) => h.stageKey === selectedStageId) ?? null;
  const selectedStageStatus =
    selectedStageEntry?.status ??
    (selectedCrq ? (selectedCrq as any)[WORKFLOW_STAGES[selectedStageIndex].statusField] : undefined);
  const isRunning = selectedStageStatus === "In Progress";

  // A cancelled stage can no longer be driven: its outcome is final. Only
  // Start/Pause is frozen by it (the same rule StageCard already applies on
  // the list pages) - every record action stays clickable, because the dialogs
  // they open drop their own action controls when cancelled and remain worth
  // opening to read. Same status the stage rail renders as a red "Canceled"
  // chip; see StageReviewDialog / PlanInvDialog / ValidateDialog for the
  // read-only side.
  const isStageCanceled =
    isCanceledStatus(selectedStageStatus) || isCanceledStatus(selectedCrq?.crqStatus);

  // Seed the sidebar's expansion state and the selected stage from the
  // route's crqNo the first time its detail loads - independent of the
  // sidebar's paginated list, which may not even contain this CRQ on its
  // current page/search.
  useEffect(() => {
    if (hasInitializedSelection || !selectedCrqNo || !selectedCrq || !selectedPlan) return;
    setExpPlans((prev) => ({ ...prev, [selectedPlan.planNumber]: true }));
    setExpCrqs((prev) => ({ ...prev, [selectedCrqNo]: true }));
    setSelectedStageId(WORKFLOW_STAGES[resolveCurrentStageIndex(selectedCrq)].id);
    setHasInitializedSelection(true);
  }, [hasInitializedSelection, selectedCrqNo, selectedCrq, selectedPlan]);

  const handleTogglePlan = useCallback(
    (planNumber: string) => setExpPlans((prev) => ({ ...prev, [planNumber]: !prev[planNumber] })),
    [],
  );
  const handleToggleCrq = useCallback(
    (targetCrqNo: string) => setExpCrqs((prev) => ({ ...prev, [targetCrqNo]: !prev[targetCrqNo] })),
    [],
  );
  const handleSelectCrq = useCallback(
    (crq: Crq, planNumber: string) => {
      setExpPlans((prev) => ({ ...prev, [planNumber]: true }));
      setExpCrqs((prev) => ({ ...prev, [crq.crqNo]: true }));
      setSelectedStageId(WORKFLOW_STAGES[resolveCurrentStageIndex(crq)].id);
      navigate(`/scheduler/crqWorkflow/${crq.crqNo}?${searchParams.toString()}`, { replace: true });
    },
    [navigate, searchParams],
  );
  const handleSelectStage = useCallback((stageId: WorkflowStageId) => setSelectedStageId(stageId), []);

  const openPreviewPdf = useCallback((targetCrqNo: string) => {
    setPreviewPdfCrqNo(targetCrqNo);
    setPreviewPdfOpen(true);
  }, []);

  const handleStartPause = useCallback(async () => {
    if (!selectedCrq) return;

    if (isReviewStage) {
      const reviewStatus =
        selectedCrq.history?.find((h) => h.stageKey === "review")?.status ??
        selectedCrq.crqReviewStatus ??
        "";
      const isRunningNow = reviewStatus.toLowerCase() === "in progress";
      const action = isRunningNow ? "pause" : "start";
      try {
        const response = await updateCrqReviewStatus({
          crqNo: selectedCrq.crqNo,
          crqId: selectedCrq.crqId,
          action,
        }).unwrap();
        toast.success(response?.message || "Updated successfully.");
        // CrqReview tag invalidation refetches selectedCrqData/pagedData.
      } catch (err) {
        toast.error((err as any)?.data?.message || "Failed to update status. Please try again.");
      }
      return;
    }

    if (!activeStageWorkflow) return;
    await activeStageWorkflow.toggleStartPause(selectedCrq);
  }, [selectedCrq, isReviewStage, activeStageWorkflow, updateCrqReviewStatus]);

  const handleSubmitDone = useCallback(
    async (values: Record<string, any>, crq: Crq) => {
      if (isReviewStage || !activeStageWorkflow) return { success: false };
      return activeStageWorkflow.submitDone(values, crq);
    },
    [isReviewStage, activeStageWorkflow],
  );

  /**
   * Plan & Inventory review submit -> /crqworkflow/updatecrqreview/done.
   * On Pass the backend advances the CRQ to Impact Analysis transactionally.
   * Mirrors buildCommonDonePayload's shape (stageConfig.ts) so this stage's
   * mandatory olmId/planNumber/taskNumber and the cancellation block reach
   * the backend exactly like the other six stages.
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

  /** Real previous-stage data (crq.history) - replaces the old mock lookup. */
  const handleShowPrevCrqStatus = useCallback(() => {
    if (!selectedCrq) return;
    const previousStages = (selectedCrq.history ?? []).filter((h) => !h.current);
    if (selectedCrq.history?.length) {
      setPrevCrqData({
        ...selectedCrq,
        planNumber: selectedCrq.planNumber ?? selectedPlan?.planNumber,
        planType: selectedCrq.planType ?? selectedPlan?.planType,
      });
      setPrevCrqStatusOpen(true);
      if (!previousStages.length) {
        toast.info("This CRQ has not completed any previous stage yet.");
      }
    } else {
      toast.warn("No previous CRQ status found for the selected CRQ.");
    }
  }, [selectedCrq, selectedPlan]);

  const crqActions: CRQAction[] = useMemo(
    () => [
      // Plan & Inventory only: the validation attributes belong to the VALIDATE
      // stage, so the action appears on that stage and follows the same gate the
      // panel's own Start/Pause uses - enabled while the stage is the CRQ's
      // current (editable) one, present but inert once it has moved on.
      ...(isReviewStage && canEdit
        ? [
            {
              key: "validate",
              label: "Sync Plan Data",
              icon: <FactCheckRoundedIcon sx={{ fontSize: 16 }} />,
              disabled: !selectedCrq || stageMode !== "editable" || isCrqDone,
              onClick: () => setValidateOpen(true),
            } satisfies CRQAction,
          ]
        : []),
      // "Attribute Update" deliberately no longer lives here: it moved inside
      // the stage's Review dialog, directly above its outcome selector, so the
      // attributes are updated in the same breath as the Pass/Failed decision
      // they justify. See dialog/AttributeUpdateGate.
      {
        key: "show-prev-crq-status",
        label: "CRQ Details",
        icon: <VisibilityIcon sx={{ fontSize: 16 }} />,
        disabled: !selectedCrq || stageMode !== "editable" || isCrqDone,
        onClick: handleShowPrevCrqStatus,
      },
      // Scheduling and Network Execution only: these are the two stages where an
      // engineer reservation already exists, which is exactly what
      // CRQ_SP_RESCHEDULE_CONFIRM_SLOT archives and replaces. Also gated on the
      // Scheduler module's UPDATE permission, like every other mutating action.
      ...(RESCHEDULABLE_STAGES.has(selectedStageId) && canReschedule
        ? [
            {
              key: "reschedule",
              label: "Reschedule",
              icon: <EventRepeatRoundedIcon sx={{ fontSize: 16 }} />,
              // The one record action a cancelled stage still blocks: the
              // wizard exists only to book a new engineer slot, so there is no
              // read-only version of it worth opening.
              disabled:
                !selectedCrq || stageMode !== "editable" || isCrqDone || isStageCanceled,
              onClick: () => setRescheduleOpen(true),
            } satisfies CRQAction,
          ]
        : []),
    ],
    [
      selectedCrq,
      isReviewStage,
      stageMode,
      selectedStageId,
      isCrqDone,
      isStageCanceled,
      canEdit,
      canReschedule,
      handleShowPrevCrqStatus,
    ],
  );

  // Reported inside the list panel rather than as a full-page state: the list
  // is now opened on demand, and a failure to load it must not take the
  // selected CRQ's cockpit down with it.
  const pagedErrorMessage = isPagedError
    ? (pagedError as any)?.error || "Please try again."
    : null;

  return (
    <Box
      sx={{
        height: "calc(100vh - 130px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        borderRadius: colors.radiusXL,
        bgcolor: colors.bg,
      }}
    >
      {GlobalStyleBlock}

      {/* Toggle lives in its own strip above the split panes so it never
          sits on top of sidebar or header content in either state. */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          height: 34,
          pl: { xs: "8px", md: crqListVisible ? "302px" : "8px" },
          borderBottom: `1px solid ${colors.border}`,
          bgcolor: colors.surface,
          transition: "padding-left 0.2s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <Tooltip title={crqListVisible ? "Hide CRQ List" : "Show all CRQs"} placement="right">
          <IconButton
            size="small"
            aria-label={crqListVisible ? "Hide CRQ List" : "Show all CRQs"}
            onClick={handleToggleCrqList}
            sx={{
              width: 26,
              height: 26,
              bgcolor: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow: "0 2px 6px rgba(20,30,50,0.12)",
              "&:hover": { bgcolor: colors.surface2 },
            }}
          >
            {crqListVisible ? (
              <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
            ) : (
              <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
        {/* Mobile/tablet backdrop - tapping outside the list closes it, same
            crqListVisible state the desktop inline collapse uses. */}
        {crqListVisible && (
          <Box
            onClick={() => setCrqListVisible(false)}
            sx={{
              display: { xs: "block", md: "none" },
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(15,23,42,0.4)",
              zIndex: 2,
            }}
          />
        )}

        <Box
          sx={{
            position: { xs: "absolute", md: "relative" },
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 3,
            height: "100%",
            boxShadow: { xs: crqListVisible ? "0 8px 24px rgba(15,23,42,0.25)" : "none", md: "none" },
          }}
        >
          <CrqWorkflowSidebar
            crqListVisible={crqListVisible}
            plans={pagedData?.content ?? []}
            expPlans={expPlans}
            expCrqs={expCrqs}
            selectedCrqNo={selectedCrqNo}
            onTogglePlan={handleTogglePlan}
            onToggleCrq={handleToggleCrq}
            onSelectCrq={handleSelectCrq}
            searchValue={globalSearchInput}
            onSearchChange={setGlobalSearchInput}
            page={page}
            pageSize={pageSize}
            totalElements={pagedData?.totalElements ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
            isLoading={isPagedLoading || isPagedFetching}
            errorMessage={pagedErrorMessage}
            colors={colors}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {isSelectedCrqError ? (
            <Stack alignItems="center" justifyContent="center" spacing={1.2} sx={{ flex: 1, p: 4, textAlign: "center" }}>
              <ErrorOutlineRoundedIcon sx={{ fontSize: 32, color: colors.danger }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
                Unable to load this CRQ
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: colors.textDim, maxWidth: 320 }}>
                Please try again.
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => refetchSelectedCrq()}
                startIcon={<RefreshRoundedIcon sx={{ fontSize: 15 }} />}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
              >
                Retry
              </Button>
            </Stack>
          ) : !selectedCrq ? (
            isSelectedCrqFetching && selectedCrqNo ? (
              <CockpitSkeleton colors={colors} />
            ) : (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{ flex: 1, p: 4, textAlign: "center" }}
              >
                {selectedCrqNo ? (
                  <FindInPageRoundedIcon sx={{ fontSize: 36, color: colors.textDim }} />
                ) : (
                  <TouchAppRoundedIcon sx={{ fontSize: 36, color: colors.textDim }} />
                )}
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
                  {selectedCrqNo ? `No CRQ found for ${selectedCrqNo}` : "Select a CRQ"}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: colors.textDim, maxWidth: 320 }}>
                  {selectedCrqNo
                    ? "It may have been removed, or you may not have access to it."
                    : "Choose a CRQ from the list on the left to view its full workflow details."}
                </Typography>
              </Stack>
            )
          ) : (
            <>
              <CrqWorkflowHeader crq={selectedCrq} currentStageIndex={currentStageIndex} colors={colors} />
              <StageRail
                crq={selectedCrq}
                currentStageIndex={currentStageIndex}
                selectedStageId={selectedStageId}
                onSelectStage={handleSelectStage}
                onPreviewCrq={() => openPreviewPdf(selectedCrq.crqNo)}
                colors={colors}
              />

              {/* Static - deliberately outside the scrollable Box below, so
                  scrolled stage content can never render above it. */}
              <CrqActionPanel
                stageLabel={WORKFLOW_STAGES[selectedStageIndex].label}
                mode={stageMode}
                isRunning={isRunning}
                onStartPause={handleStartPause}
                onReview={() => setReviewDialogOpen(true)}
                isBusy={activeStageWorkflow?.isTogglingStatus}
                readOnly={!canEdit}
                isCanceled={isStageCanceled}
                recordActions={crqActions}
                colors={colors}
              />

              <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
                <StageSummaryGrid
                  fields={getStageSummaryFields(selectedStageId, selectedCrq)}
                  colors={colors}
                  excludeSectionIds={["activity", "workflow", "engineer"]}
                />

                {/* Completed previous stages - read-only, no actions. */}
                <Box sx={{ mt: 1.5 }}>
                  <CrqHistoryTable history={selectedCrq.history} colors={colors} />
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {isReviewStage ? (
        <PlanInvDialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          crq={selectedCrq}
          colors={colors}
          onSubmit={handleReviewSubmit}
        />
      ) : (
        <StageReviewDialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          crq={selectedCrq}
          colors={colors}
          stageConfig={getStageConfig(selectedStageId as StageKey)}
          onSubmitDone={handleSubmitDone}
        />
      )}

      <PrevCrqStatusDialog
        open={prevCrqStatusOpen}
        onClose={() => setPrevCrqStatusOpen(false)}
        crqData={prevCrqData}
        colors={colors}
        onPreviewCrq={prevCrqData ? () => openPreviewPdf(prevCrqData.crqNo) : undefined}
      />

      <PreviewCrqPdfDialog
        open={previewPdfOpen}
        onClose={() => setPreviewPdfOpen(false)}
        crqNo={previewPdfCrqNo}
        colors={colors}
      />

      <Suspense fallback={null}>
        <AttributeUpdateDialog />
      </Suspense>

      {/* Same on-demand mount as the wizard below. The dialog reads its own
          details from get_crq_validation_details and writes nothing outside
          CRQ_VALIDATION_DETAILS_TBL, so no cockpit refresh is needed on save. */}
      {validateOpen && (
        <Suspense fallback={null}>
          <ValidateDialog
            open={validateOpen}
            onClose={() => setValidateOpen(false)}
            crqNo={selectedCrq?.crqNo ?? null}
            colors={colors}
            readOnly={isStageCanceled}
          />
        </Suspense>
      )}

      {/* Mounted only once opened, so the wizard's chunk is fetched on demand. */}
      {rescheduleOpen && (
        <Suspense fallback={null}>
          <RescheduleDialog
            open={rescheduleOpen}
            onClose={() => setRescheduleOpen(false)}
            crqId={selectedCrq?.crqId ?? null}
            crqNo={selectedCrq?.crqNo ?? null}
            colors={colors}
            activityPlanStartDate={selectedCrq?.activityPlanStartDate ?? null}
            activityPlanEndDate={selectedCrq?.activityPlanEndDate ?? null}
          />
        </Suspense>
      )}
    </Box>
  );
};

export default CrqDetailedView;
