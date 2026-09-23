import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  alpha,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import EditOffOutlinedIcon from "@mui/icons-material/EditOffOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import { FutureWeekGrid, EditModeBar } from "./FutureWeekGrid";
import type { PendingChangesMap, EditMode } from "./FutureWeekGrid";
import { usePaginatedFutureWeek } from "./Usepaginatedfutureweek";
import { ShiftChip } from "./Shiftchip";
import { SHIFT_DISPLAY_ORDER, SHIFT_TO_API } from "../../util/Shiftconstants";
import { useUpdateFutureWeekBatchMutation } from "../../api/rosterGenerationApiSlice";
import type { ShiftCode } from "../../types/Futureweek.types";
import { isoWeekLabel } from "../../util/Futureweek.utils";

interface GridscreenMainProps {
  subDomainId: number | string | undefined;
}

interface PrimaryToolbarProps {
  editing: boolean;
  weekLabel: string;
  loaded: number;
  totalEmployees: number;
  isLoading: boolean;
  isFetchingMore: boolean;
  loadProgress: number;
  hasPending: boolean;
  isSaving: boolean;
  pendingCount: number;
  toggleEditMode: () => void;
  handleSave: () => void;
  accent: string;
  isDark: boolean;
}

interface EditModePanelProps {
  editMode: EditMode;
  setEditMode: React.Dispatch<React.SetStateAction<EditMode>>;
  brush: ShiftCode;
  setBrush: React.Dispatch<React.SetStateAction<ShiftCode>>;
  hasPending: boolean;
  isSaving: boolean;
  pendingCount: number;
  handleDiscard: () => void;
  editModeHint: Record<EditMode, string>;
  accent: string;
  accentDim: string;
  isDark: boolean;
}

const MONO_FONT = "'Roboto Mono', 'Fira Mono', monospace";

function ShiftLegend() {
  return (
    <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
      {SHIFT_DISPLAY_ORDER.map((code) => (
        <ShiftChip key={code} code={code} size="sm" />
      ))}
    </Stack>
  );
}

function PrimaryToolbar({
  editing,
  weekLabel,
  loaded,
  totalEmployees,
  isLoading,
  isFetchingMore,
  loadProgress,
  hasPending,
  isSaving,
  pendingCount,
  toggleEditMode,
  handleSave,
  accent,
  isDark,
}: PrimaryToolbarProps) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        px: 2,
        py: 1.25,
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(13,27,42,0.07)"}`,
        background: isDark
          ? "linear-gradient(135deg,rgba(16,185,129,0.06),rgba(99,102,241,0.04))"
          : "linear-gradient(135deg,rgba(16,185,129,0.03),rgba(99,102,241,0.02))",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
      }}
    >
      <ShiftLegend />

      <Box sx={{ flex: 1 }} />

      {weekLabel && (
        <Chip
          size="small"
          icon={<VerifiedOutlinedIcon sx={{ fontSize: "12px !important" }} />}
          label={weekLabel}
          sx={{
            height: 22,
            fontSize: 10.5,
            fontWeight: 650,
            borderRadius: "6px",
            bgcolor: isDark ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.08)",
            color: isDark ? "#6EE7B7" : "#065F46",
            border: `1px solid ${isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)"}`,
          }}
        />
      )}

      {!isLoading && (
        <Chip
          size="small"
          icon={<GroupsOutlinedIcon sx={{ fontSize: "12px !important" }} />}
          label={isFetchingMore ? `${loaded} / ${totalEmployees} (${loadProgress}%)` : `${loaded} employees`}
          sx={{ height: 22, fontSize: 10.5, fontWeight: 650, borderRadius: "6px" }}
        />
      )}

      {isFetchingMore && (
        <Tooltip title={`Loading… ${loadProgress}%`} arrow>
          <CircularProgress size={14} thickness={5} sx={{ color: accent }} />
        </Tooltip>
      )}

      <Tooltip title={editing ? "Exit edit mode" : "Enter edit mode"} arrow>
        <Button
          size="small"
          variant={editing ? "contained" : "outlined"}
          color={editing ? "warning" : "inherit"}
          startIcon={editing ? <EditOffOutlinedIcon sx={{ fontSize: 15 }} /> : <EditOutlinedIcon sx={{ fontSize: 15 }} />}
          onClick={toggleEditMode}
          disableElevation
          sx={{
            fontSize: 12,
            height: 30,
            borderRadius: "8px",
            fontWeight: 600,
            textTransform: "none",
            minWidth: 120,
          }}
        >
          {editing ? "Done Editing" : "Edit Shifts"}
        </Button>
      </Tooltip>

      <Tooltip
        title={
          isSaving
            ? "Saving…"
            : hasPending
            ? `Save ${pendingCount} changed row${pendingCount > 1 ? "s" : ""}`
            : "No pending changes"
        }
        arrow
      >
        <span>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={isSaving ? <CircularProgress size={13} thickness={5} sx={{ color: "inherit" }} /> : <SaveOutlinedIcon sx={{ fontSize: 15 }} />}
            onClick={handleSave}
            disabled={!hasPending || isSaving}
            disableElevation
            sx={{
              fontSize: 12,
              height: 30,
              borderRadius: "8px",
              fontWeight: 700,
              textTransform: "none",
              minWidth: 110,
              ...(hasPending && !isSaving && {
                boxShadow: `0 0 0 3px ${alpha(accent, 0.22)}`,
                "&:hover": { boxShadow: `0 0 0 4px ${alpha(accent, 0.32)}` },
              }),
              transition: "box-shadow 0.2s",
            }}
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
}


export default function GridscreenMain({ subDomainId }: GridscreenMainProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent    = theme.palette.primary.main;
  const accentDim = alpha(accent, 0.08);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [brush, setBrush]       = useState<ShiftCode>("G");
  const [editing, setEditing]   = useState<boolean>(false);
  const [editMode, setEditMode] = useState<EditMode>("select");
  const [toast, setToast]       = useState<{
    msg: string;
    severity: "success" | "error";
  } | null>(null);

  // ── Pending-changes state ─────────────────────────────────────────────────
  const [pendingChanges, setPendingChanges] = useState<PendingChangesMap>({});
  const pendingCount = Object.keys(pendingChanges).length;
  const hasPending   = pendingCount > 0;
  const clearPendingRef = useRef<(() => void) | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    employees,
    isoWeek,
    isoYear,
    totalEmployees,
    isLoading,
    isFetchingMore,
    hasMore,
    isError,
    loadProgress,
    loadMore,
    load,
  } = usePaginatedFutureWeek();

  const [updateBatch, { isLoading: isSaving }] =
    useUpdateFutureWeekBatchMutation();

  useEffect(() => {
    if (subDomainId !== undefined && subDomainId !== null && subDomainId !== "") {
      load(Number(subDomainId));
    }
  }, [subDomainId, load]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const weekLabel = isoWeek > 0 ? isoWeekLabel(isoYear, isoWeek) : "";
  const loaded    = employees.length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleEditMode = useCallback(() => {
    setEditing((v) => {
      if (v) setEditMode("select");
      return !v;
    });
  }, []);

  const handleDiscard = useCallback(() => {
    setPendingChanges({});
    clearPendingRef.current?.();
  }, []);

  const handleSave = useCallback(async () => {
    if (pendingCount === 0) return;

    const toApiShift = (shift: ShiftCode) => SHIFT_TO_API[shift] ?? shift;

    const payload = Object.entries(pendingChanges).map(([futureIdStr, shifts]) => {
      const futureId = Number(futureIdStr);
      const emp = employees.find((e) => e.futureId === futureId);
      const userId = emp?.userId ?? futureId;
      const [W7D1, W7D2, W7D3, W7D4, W7D5, W7D6, W7D7] = shifts;
      return {
        userId,
        year: isoYear,
        week: isoWeek,
        W7D1: toApiShift(W7D1),
        W7D2: toApiShift(W7D2),
        W7D3: toApiShift(W7D3),
        W7D4: toApiShift(W7D4),
        W7D5: toApiShift(W7D5),
        W7D6: toApiShift(W7D6),
        W7D7: toApiShift(W7D7),
      };
    });

    try {
      await updateBatch(payload).unwrap();
      setPendingChanges({});
      clearPendingRef.current?.();

      if (subDomainId !== undefined && subDomainId !== null && subDomainId !== "") {
        load(Number(subDomainId));
      }

      setToast({
        msg: `${pendingCount} row${pendingCount > 1 ? "s" : ""} saved successfully`,
        severity: "success",
      });
      setEditing(false);
      setEditMode("select");
    } catch {
      setToast({
        msg: "Save failed — your changes are still pending",
        severity: "error",
      });
    }
  }, [pendingChanges, pendingCount, employees, isoYear, isoWeek, updateBatch, subDomainId, load]);

  // ── Edit-mode hint text ───────────────────────────────────────────────────
  // FIX: original was missing the "row" key, causing a TS error.
  const editModeHint: Record<EditMode, string> = {
    select:
      "Click a cell to apply the active shift immediately. Shift+click extends a rectangle — then pick a shift in the popup.",
    column:
      "Click a day header to select that column. Shift+click adds adjacent columns. Pick a shift in the popup.",
    row:
      "Click an employee's name to select their full week. Shift+click adds more rows. Pick a shift in the popup.",
  };

  // ── Colours ───────────────────────────────────────────────────────────────
  const toolbarBg = isDark
    ? "linear-gradient(135deg,rgba(16,185,129,0.06),rgba(99,102,241,0.04))"
    : "linear-gradient(135deg,rgba(16,185,129,0.03),rgba(99,102,241,0.02))";

  const editBg = isDark ? "rgba(24,95,165,0.06)" : "rgba(24,95,165,0.025)";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        "@keyframes tkPulse": {
          "0%,100%": { opacity: 1 },
          "50%": { opacity: 0.35 },
        },
      }}
    >
      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {isError && (
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.06)",
            borderBottom: `1px solid ${
              isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.15)"
            }`,
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 15, color: "error.main" }} />
          <Typography sx={{ fontSize: 12, color: "error.main", fontWeight: 600 }}>
            Failed to load schedule data. Check your network and try refreshing.
          </Typography>
        </Box>
      )}

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      {isFetchingMore && (
        <Box sx={{ flexShrink: 0 }}>
          <LinearProgress
            variant="determinate"
            value={loadProgress}
            sx={{
              height: 2,
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              "& .MuiLinearProgress-bar": {
                bgcolor: accent,
                transition: "transform 0.25s ease",
              },
            }}
          />
        </Box>
      )}

      {/* ── Primary toolbar ───────────────────────────────────────────────── */}
      <Box
        sx={{
          flexShrink: 0,
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${
            isDark ? "rgba(255,255,255,0.07)" : "rgba(13,27,42,0.07)"
          }`,
          background: toolbarBg,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <ShiftLegend />

        <Box sx={{ flex: 1 }} />

        {/* Employee count */}
        {!isLoading && (
          <Chip
            size="small"
            icon={<GroupsOutlinedIcon sx={{ fontSize: "12px !important" }} />}
            label={
              isFetchingMore
                ? `${loaded} / ${totalEmployees} (${loadProgress}%)`
                : `${loaded} employees`
            }
            sx={{ height: 22, fontSize: 10.5, fontWeight: 650, borderRadius: "6px" }}
          />
        )}

        {isFetchingMore && (
          <Tooltip title={`Loading… ${loadProgress}%`} arrow>
            <CircularProgress size={14} thickness={5} sx={{ color: accent }} />
          </Tooltip>
        )}

        {/* Toggle edit mode */}
        <Tooltip title={editing ? "Exit edit mode" : "Enter edit mode"} arrow>
          <Button
            size="small"
            variant={editing ? "contained" : "outlined"}
            color={editing ? "warning" : "inherit"}
            startIcon={
              editing
                ? <EditOffOutlinedIcon sx={{ fontSize: 15 }} />
                : <EditOutlinedIcon sx={{ fontSize: 15 }} />
            }
            onClick={toggleEditMode}
            disableElevation
            sx={{
              fontSize: 12,
              height: 30,
              borderRadius: "8px",
              fontWeight: 600,
              textTransform: "none",
              minWidth: 120,
            }}
          >
            {editing ? "Done Editing" : "Edit Shifts"}
          </Button>
        </Tooltip>

        {/* Save */}
        <Tooltip
          title={
            isSaving
              ? "Saving…"
              : hasPending
              ? `Save ${pendingCount} changed row${pendingCount > 1 ? "s" : ""}`
              : "No pending changes"
          }
          arrow
        >
          <span>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={
                isSaving
                  ? <CircularProgress size={13} thickness={5} sx={{ color: "inherit" }} />
                  : <SaveOutlinedIcon sx={{ fontSize: 15 }} />
              }
              onClick={handleSave}
              disabled={!hasPending || isSaving}
              disableElevation
              sx={{
                fontSize: 12,
                height: 30,
                borderRadius: "8px",
                fontWeight: 700,
                textTransform: "none",
                minWidth: 110,
                ...(hasPending && !isSaving && {
                  boxShadow: `0 0 0 3px ${alpha(accent, 0.22)}`,
                  "&:hover": { boxShadow: `0 0 0 4px ${alpha(accent, 0.32)}` },
                }),
                transition: "box-shadow 0.2s",
              }}
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* ── Edit-mode bar ─────────────────────────────────────────────────── */}
      {editing && (
        <Box
          sx={{
            flexShrink: 0,
            px: 2,
            py: 1.25,
            borderBottom: `1px solid ${
              isDark ? "rgba(255,255,255,0.07)" : "rgba(13,27,42,0.07)"
            }`,
            bgcolor: editBg,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          {/* EDIT MODE badge */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.5,
              borderRadius: "6px",
              bgcolor: accentDim,
              border: `1px solid ${alpha(accent, 0.35)}`,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: accent,
                animation: "tkPulse 2s infinite",
              }}
            />
            <Typography
              sx={{
                fontSize: 11,
                color: accent,
                fontWeight: 700,
                letterSpacing: "0.02em",
                fontFamily: MONO_FONT,
              }}
            >
              EDIT MODE
            </Typography>
          </Box>

          {/* Mode switcher */}
          <EditModeBar editMode={editMode} onChange={setEditMode} />

          {/* Brush selector — used in select mode for instant-apply on single click */}
          <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
            <Typography
              sx={{
                fontSize: 10.5,
                color: "text.disabled",
                fontWeight: 500,
                display: { xs: "none", sm: "block" },
              }}
            >
              Brush:
            </Typography>
            {SHIFT_DISPLAY_ORDER.map((code) => (
              <Box key={code} onClick={() => setBrush(code)} sx={{ cursor: "pointer" }}>
                <ShiftChip code={code} size="md" active={brush === code} />
              </Box>
            ))}
          </Stack>

          {/* Hint text */}
          <Typography
            sx={{
              fontSize: 10.5,
              color: isDark ? "rgba(255,255,255,0.35)" : "rgba(13,27,42,0.4)",
              fontStyle: "italic",
              display: { xs: "none", md: "block" },
            }}
          >
            {editModeHint[editMode]}
          </Typography>

          <Box sx={{ flex: 1 }} />

          {/* Pending summary + Discard */}
          <Stack direction="row" alignItems="center" gap={1}>
            {hasPending && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.25,
                  py: 0.4,
                  borderRadius: "20px",
                  bgcolor: isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.08)",
                  border: `1px solid ${
                    isDark ? "rgba(245,158,11,0.35)" : "rgba(245,158,11,0.25)"
                  }`,
                }}
              >
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    bgcolor: "warning.main",
                    animation: "tkPulse 1.8s infinite",
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isDark ? "#FCD34D" : "#92400E",
                    fontFamily: MONO_FONT,
                  }}
                >
                  {pendingCount} unsaved
                </Typography>
              </Box>
            )}

            {hasPending && (
              <Tooltip title="Discard all unsaved changes" arrow>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<UndoOutlinedIcon sx={{ fontSize: 14 }} />}
                  onClick={handleDiscard}
                  disabled={isSaving}
                  sx={{
                    fontSize: 11.5,
                    height: 30,
                    borderRadius: "8px",
                    fontWeight: 600,
                    textTransform: "none",
                    borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)",
                    color: "text.secondary",
                    "&:hover": {
                      borderColor: "error.main",
                      color: "error.main",
                      bgcolor: isDark ? "rgba(239,68,68,0.07)" : "rgba(239,68,68,0.04)",
                    },
                  }}
                >
                  Discard
                </Button>
              </Tooltip>
            )}
          </Stack>
        </Box>
      )}

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <FutureWeekGrid
          employees={employees}
          isoYear={isoYear}
          isoWeek={isoWeek}
          isLoading={isLoading}
          totalEmployees={totalEmployees}
          editing={editing}
          editMode={editMode}
          brush={brush}
          onPendingChanges={setPendingChanges}
          clearPendingRef={clearPendingRef}
          onLoadMore={loadMore}
          hasMore={hasMore}
          isFetchingMore={isFetchingMore}
          loadedCount={employees.length}
          totalCount={totalEmployees}
        />
      </Box>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <Snackbar
        open={!!toast}
        autoHideDuration={2800}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast?.severity ?? "success"}
          variant="filled"
          icon={toast?.severity === "success" ? <CheckIcon /> : undefined}
          sx={{ alignItems: "center", borderRadius: "12px" }}
        >
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}