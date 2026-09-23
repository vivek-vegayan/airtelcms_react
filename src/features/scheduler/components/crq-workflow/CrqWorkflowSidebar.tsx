import React from "react";
import { format } from "date-fns";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import FirstPageRoundedIcon from "@mui/icons-material/FirstPageRounded";
import LastPageRoundedIcon from "@mui/icons-material/LastPageRounded";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import type { Colors } from "../../types/colorTypes";
import type { Crq, Plan } from "../../types/crqWorkflow.types";
import {
  WORKFLOW_STAGES,
  classifyStatusValue,
  resolveCurrentStageIndex,
  resolveStageState,
} from "../../constants/workflowStages";

export const CRQ_LIST_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const formatTaskDate = (value?: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : format(d, "dd-MMM HH:mm");
};

interface CrqWorkflowSidebarProps {
  /** Drives the panel's smooth horizontal collapse - purely presentational,
   * never coupled to CRQ selection (selecting a CRQ never changes this). */
  crqListVisible: boolean;
  plans: Plan[];
  expPlans: Record<string, boolean>;
  expCrqs: Record<string, boolean>;
  selectedCrqNo: string | null;
  onTogglePlan: (planNumber: string) => void;
  onToggleCrq: (crqNo: string) => void;
  onSelectCrq: (crq: Crq, planNumber: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Server-side pagination (0-indexed page), following the same
   * page/size -> PageResponseDto convention as planApiSlice's PlanViewTable. */
  page: number;
  pageSize: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** True while the current page's rows are being fetched - renders skeleton
   * rows instead of "No plans found" so an empty-looking page mid-fetch
   * doesn't read as a genuinely empty result. */
  isLoading?: boolean;
  /** Set when the list's own query failed - shown in place of the tree so a
   * list-level failure never takes down the selected CRQ's cockpit beside it. */
  errorMessage?: string | null;
  colors: Colors;
}

/** Per-CRQ status dot + chip, matching the reference tree row's status
 * indicator - derived from the same resolveStageState the stage rail uses
 * when full history[] is available (e.g. a CRQ fetched via the single-CRQ
 * hydration endpoint), falling back to classifying the row's own crqStatus
 * text when it isn't (the paginated list's rows, which omit history[] to
 * keep list pages cheap - see CrqWorkflowService.getWorkflowOverviewPaged). */
const crqStatusMeta = (crq: Crq, colors: Colors) => {
  const idx = resolveCurrentStageIndex(crq);
  const state = crq.history?.length ? resolveStageState(crq, idx, idx) : classifyStatusValue(crq.crqStatus);
  if (state === "completed") {
    return { dot: colors.success, chipBg: colors.successDim, chipFg: colors.success, chipLabel: "Done" };
  }
  if (state === "in_progress") {
    return { dot: colors.accent, chipBg: colors.infoDim, chipFg: colors.info, chipLabel: "In Progress" };
  }
  if (state === "failed") {
    return { dot: colors.danger, chipBg: colors.dangerDim, chipFg: colors.danger, chipLabel: "Failed" };
  }
  if (state === "canceled") {
    return { dot: colors.danger, chipBg: colors.dangerDim, chipFg: colors.danger, chipLabel: "Canceled" };
  }
  return { dot: colors.textDim, chipBg: colors.trackOff, chipFg: colors.textDim, chipLabel: "Paused" };
};

/**
 * Left Plan -> CRQ -> Task tree for the CRQ workflow cockpit. Reads/writes
 * the same plans/expand-state shape the rest of the scheduler feature
 * already uses (Plan.crqs[].tasks[]) - purely a navigation view, no
 * business logic of its own.
 */
export const CrqWorkflowSidebar: React.FC<CrqWorkflowSidebarProps> = ({
  crqListVisible,
  plans,
  expPlans,
  expCrqs,
  selectedCrqNo,
  onTogglePlan,
  onToggleCrq,
  onSelectCrq,
  searchValue,
  onSearchChange,
  page,
  pageSize,
  totalElements,
  onPageChange,
  onPageSizeChange,
  isLoading,
  errorMessage,
  colors,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const rangeStart = totalElements === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min(totalElements, (page + 1) * pageSize);
  const isFirstPage = page <= 0;
  const isLastPage = page >= totalPages - 1;

  return (
    <Collapse
      orientation="horizontal"
      in={crqListVisible}
      timeout={200}
      collapsedSize={0}
      sx={{
        height: "100%",
        "& .MuiCollapse-wrapper": { height: "100%" },
        "& .MuiCollapse-wrapperInner": { height: "100%" },
      }}
    >
      <Box
        sx={{
          width: 328,
          height: "100%",
          bgcolor: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Box sx={{ p: "13px 14px 11px", borderBottom: `1px solid ${colors.border}` }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search plans, CRQs, tasks…"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 15, color: colors.textDim }} />
                </InputAdornment>
              ),
              sx: { fontSize: 13, borderRadius: "9px", bgcolor: colors.trackOff },
            }}
          />
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 1.2, minHeight: 0 }}>
      {errorMessage ? (
        <Stack alignItems="center" spacing={0.7} sx={{ p: 2, textAlign: "center" }}>
          <ErrorOutlineRoundedIcon sx={{ fontSize: 24, color: colors.danger }} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>
            Unable to load the CRQ list
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: colors.textDim }}>{errorMessage}</Typography>
        </Stack>
      ) : null}
      {isLoading && !plans.length
        ? Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={54}
              sx={{ borderRadius: colors.radiusL, mb: 1 }}
            />
          ))
        : null}
      {plans.map((plan) => {
        const isPlanOpen = !!expPlans[plan.planNumber];
        const crqs = plan.crqs ?? [];
        return (
          <Box
            key={plan.planNumber}
            sx={{
              mb: 1,
              border: `1px solid ${colors.border}`,
              borderRadius: colors.radiusL,
              overflow: "hidden",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.1}
              onClick={() => onTogglePlan(plan.planNumber)}
              sx={{
                px: 1.5,
                py: 1.2,
                cursor: "pointer",
                bgcolor: colors.trackOff,
                transition: "background 0.15s ease",
                "&:hover": { bgcolor: colors.surface2 },
              }}
            >
              <ChevronRightRoundedIcon
                className={`expand-chevron${isPlanOpen ? " open" : ""}`}
                sx={{ fontSize: 16, color: colors.textDim }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 9.5,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: colors.textDim,
                    fontWeight: 800,
                  }}
                >
                  Plan · {crqs.length} {crqs.length === 1 ? "CRQ" : "CRQs"}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textPrimary,
                    mt: 0.2,
                    wordBreak: "break-all",
                  }}
                >
                  {plan.planNumber}
                </Typography>
              </Box>
              <Chip
                label={plan.planType}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: colors.surface,
                  border: `1px solid ${colors.accentBorder}`,
                  color: colors.accent,
                  whiteSpace: "nowrap",
                }}
              />
            </Stack>

            {isPlanOpen && (
              <Box sx={{ p: "6px 8px 8px" }}>
                {crqs.map((crq) => {
                  const isSelected = crq.crqNo === selectedCrqNo;
                  const isCrqOpen = !!expCrqs[crq.crqNo];
                  const tasks = crq.tasks ?? [];
                  const stageIdx = resolveCurrentStageIndex(crq);
                  const statusMeta = crqStatusMeta(crq, colors);
                  return (
                    <Box key={crq.crqNo} sx={{ mt: 0.5 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        onClick={() => onSelectCrq(crq, plan.planNumber)}
                        sx={{
                          px: 1.2,
                          py: 1.1,
                          borderRadius: "9px",
                          cursor: "pointer",
                          border: `1px solid ${isSelected ? colors.accentBorder : "transparent"}`,
                          bgcolor: isSelected ? colors.accentDim : "transparent",
                        }}
                      >
                        <ChevronRightRoundedIcon
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCrq(crq.crqNo);
                          }}
                          className={`expand-chevron${isCrqOpen ? " open" : ""}`}
                          sx={{ fontSize: 15, color: colors.textDim }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontFamily: "monospace",
                              fontSize: 12,
                              fontWeight: 600,
                              color: colors.textPrimary,
                            }}
                            noWrap
                          >
                            {crq.crqNo}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mt: 0.3 }}>
                            <FiberManualRecordIcon
                              className={statusMeta.chipLabel === "In Progress" ? "status-pulse-dot" : undefined}
                              sx={{ fontSize: 7, color: statusMeta.dot }}
                            />
                            <Typography
                              sx={{ fontSize: 11, color: colors.textSecondary, fontWeight: 600 }}
                              noWrap
                            >
                              {WORKFLOW_STAGES[stageIdx].shortLabel}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box
                          sx={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            px: "8px",
                            py: "2px",
                            borderRadius: "20px",
                            whiteSpace: "nowrap",
                            bgcolor: statusMeta.chipBg,
                            color: statusMeta.chipFg,
                          }}
                        >
                          {statusMeta.chipLabel}
                        </Box>
                      </Stack>

                      {isCrqOpen && (
                        <Box
                          sx={{
                            ml: 2.5,
                            mt: 0.4,
                            mb: 0.5,
                            pl: 1.2,
                            borderLeft: `1.5px dashed ${colors.border}`,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 9.5,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              color: colors.textDim,
                              fontWeight: 800,
                              py: 0.5,
                            }}
                          >
                            Tasks · {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                          </Typography>
                          {tasks.map((t) => {
                            const start = formatTaskDate(t.executionSlotStart);
                            const end = formatTaskDate(t.executionSlotEnd);
                            return (
                              <Box
                                key={t.taskId}
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  py: 0.7,
                                  px: 0.5,
                                  "& + &": { borderTop: `1px dashed ${colors.border}` },
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: "50%",
                                    bgcolor: colors.border,
                                    mt: 0.6,
                                    flexShrink: 0,
                                  }}
                                />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography
                                    sx={{
                                      fontFamily: "monospace",
                                      fontSize: 10.5,
                                      color: colors.textSecondary,
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {t.taskId}
                                  </Typography>
                                  <Typography sx={{ fontSize: 10.5, color: colors.textDim, fontWeight: 600 }}>
                                    {t.taskActivity || t.planActivityDetails || "—"}
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    flexWrap="wrap"
                                    columnGap={1}
                                    rowGap={0.2}
                                    sx={{ mt: 0.4 }}
                                  >
                                    {t.neLabel && (
                                      <Typography sx={{ fontSize: 9.5, color: colors.textDim }}>
                                        NE: <Box component="span" sx={{ color: colors.textSecondary, fontWeight: 600 }}>{t.neLabel}</Box>
                                      </Typography>
                                    )}
                                    {t.locationCodeM6 && (
                                      <Typography sx={{ fontSize: 9.5, color: colors.textDim }}>
                                        Loc: <Box component="span" sx={{ color: colors.textSecondary, fontWeight: 600 }}>{t.locationCodeM6}</Box>
                                      </Typography>
                                    )}
                                    {t.workAreaTerritory && (
                                      <Typography sx={{ fontSize: 9.5, color: colors.textDim }}>
                                        Area: <Box component="span" sx={{ color: colors.textSecondary, fontWeight: 600 }}>{t.workAreaTerritory}</Box>
                                      </Typography>
                                    )}
                                  </Stack>
                                  {(start || end) && (
                                    <Typography sx={{ fontSize: 9.5, color: colors.textDim, mt: 0.2 }}>
                                      {start ?? "—"} → {end ?? "—"}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            );
                          })}
                          {!tasks.length && (
                            <Typography sx={{ fontSize: 11, color: colors.textDim, py: 0.5 }}>
                              No tasks.
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })}
                {!crqs.length && (
                  <Typography sx={{ fontSize: 12, color: colors.textDim, p: 1 }}>
                    No CRQs found.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        );
      })}
      {!isLoading && !errorMessage && !plans.length && (
        <Typography sx={{ fontSize: 12, color: colors.textDim, p: 2, textAlign: "center" }}>
          No plans found.
        </Typography>
      )}
        </Box>

        {/* ──────── PAGINATION FOOTER ──────── */}
        <Stack
          spacing={0.6}
          sx={{ p: "8px 12px 10px", borderTop: `1px solid ${colors.border}`, flexShrink: 0 }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: 10.5, color: colors.textDim, fontWeight: 600 }}>
              {totalElements === 0 ? "No CRQs" : `Showing ${rangeStart}–${rangeEnd} of ${totalElements}`}
            </Typography>
            <Select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              size="small"
              variant="standard"
              disableUnderline
              sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, "& .MuiSelect-select": { py: 0, pr: "18px !important" } }}
            >
              {CRQ_LIST_PAGE_SIZE_OPTIONS.map((size) => (
                <MenuItem key={size} value={size} sx={{ fontSize: 12 }}>
                  {size} / page
                </MenuItem>
              ))}
            </Select>
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.3}>
            <Tooltip title="First page">
              <span>
                <IconButton size="small" aria-label="First page" disabled={isFirstPage} onClick={() => onPageChange(0)} sx={{ width: 24, height: 24 }}>
                  <FirstPageRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Previous page">
              <span>
                <IconButton size="small" aria-label="Previous page" disabled={isFirstPage} onClick={() => onPageChange(page - 1)} sx={{ width: 24, height: 24 }}>
                  <KeyboardArrowLeftRoundedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, px: 0.8, whiteSpace: "nowrap" }}>
              Page {page + 1} of {totalPages}
            </Typography>
            <Tooltip title="Next page">
              <span>
                <IconButton size="small" aria-label="Next page" disabled={isLastPage} onClick={() => onPageChange(page + 1)} sx={{ width: 24, height: 24 }}>
                  <KeyboardArrowRightRoundedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Last page">
              <span>
                <IconButton size="small" aria-label="Last page" disabled={isLastPage} onClick={() => onPageChange(totalPages - 1)} sx={{ width: 24, height: 24 }}>
                  <LastPageRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>
    </Collapse>
  );
};

export default CrqWorkflowSidebar;
