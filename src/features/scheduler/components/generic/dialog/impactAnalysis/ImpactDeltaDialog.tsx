import React, { useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  Divider,
  Fade,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import FolderZipTwoToneIcon from "@mui/icons-material/FolderZipTwoTone";
import FolderOpenTwoToneIcon from "@mui/icons-material/FolderOpenTwoTone";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingFlatRoundedIcon from "@mui/icons-material/TrendingFlatRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import type { Colors } from "../../../../types/colorTypes";
import { errorMessage, formatImpactModifiedDate, type ImpactBatchStatus } from "../../../../types/impactBatch.types";
import { useGetImpactAnalysisSummaryQuery } from "../../../../api/impactBatchApiSlice";

// Batch B needs its own fixed accent (distinct from the theme's primary,
// which Batch A borrows) so the two sides stay visually distinct in both
// light and dark mode - purely decorative, not a semantic status colour.
const BATCH_B_ACCENT = "#7C3AED";
const SLOT_ACCENTS = ["#1E6FD9", "#7C3AED", "#0891B2", "#0E9F6E"];
const ENTITY_DOTS = ["#1E6FD9", "#7C3AED", "#0E9F6E", "#D97706", "#DB2777", "#0891B2"];

interface ImpactDeltaDialogProps {
  open: boolean;
  onClose: () => void;
  crqNo: string | null;
  /**
   * Batches from step 1 (GET /impact/statuscsv/batch). Each carries its own
   * modifiedDate, so A and B are fetched on the date each one actually ran -
   * a single shared date would silently blank out the older side.
   */
  batches: ImpactBatchStatus[];
  colors: Colors;
}

interface ComparisonRow {
  entity: string;
  cntA: number | null;
  cntB: number | null;
}

// ─────────────────────────────────────────────
// BATCH SELECTOR PILL
// ─────────────────────────────────────────────
const DeltaBatchPill: React.FC<{
  label: string;
  sublabel: string;
  isSelected: boolean;
  selectionLabel: "A" | "B" | null;
  colorMain: string;
  colors: Colors;
  onClick: () => void;
}> = ({ label, sublabel, isSelected, selectionLabel, colorMain, colors, onClick }) => (
  <Paper
    onClick={onClick}
    elevation={0}
    sx={{
      minWidth: 148,
      flexShrink: 0,
      cursor: "pointer",
      border: `1.5px solid ${isSelected ? colorMain : colors.border}`,
      bgcolor: isSelected ? alpha(colorMain, colors.isDark ? 0.16 : 0.08) : colors.surface,
      borderRadius: colors.radiusL,
      transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
      "&:hover": { borderColor: colorMain, boxShadow: `0 2px 10px ${alpha(colorMain, 0.15)}` },
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1, px: 1.25 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: colors.radius,
          bgcolor: isSelected ? colorMain : alpha(colorMain, 0.12),
          color: isSelected ? "#fff" : colorMain,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: isSelected ? `0 2px 8px ${alpha(colorMain, 0.35)}` : "none",
        }}
      >
        {selectionLabel ? (
          <Typography sx={{ fontSize: "0.65rem", fontWeight: 800, lineHeight: 1 }}>{selectionLabel}</Typography>
        ) : isSelected ? (
          <FolderOpenTwoToneIcon sx={{ fontSize: 15 }} />
        ) : (
          <FolderZipTwoToneIcon sx={{ fontSize: 15 }} />
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          noWrap
          sx={{
            color: isSelected ? colorMain : colors.textSecondary,
            fontSize: "0.7rem",
            fontWeight: isSelected ? 700 : 600,
            letterSpacing: 0.2,
            lineHeight: 1.3,
          }}
        >
          {label}
        </Typography>
        <Typography
          noWrap
          sx={{
            color: isSelected ? alpha(colorMain, 0.75) : colors.textDim,
            fontSize: "0.6rem",
            fontWeight: 500,
            letterSpacing: 0.3,
            lineHeight: 1.2,
            mt: 0.3,
          }}
        >
          {sublabel}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

// ─────────────────────────────────────────────
// DELTA ROW — one entity compared across batches
// ─────────────────────────────────────────────
const DeltaRow: React.FC<{ row: ComparisonRow; index: number; colors: Colors }> = ({ row, index, colors }) => {
  const { entity, cntA, cntB } = row;
  const delta = cntA !== null && cntB !== null ? cntB - cntA : null;
  const pctChange = delta !== null && cntA !== null && cntA !== 0 ? ((delta / cntA) * 100).toFixed(1) : null;

  const isPositive = delta !== null && delta > 0;
  const isNegative = delta !== null && delta < 0;

  const deltaColor = isPositive ? colors.success : isNegative ? colors.danger : colors.textDim;
  const deltaBg = isPositive ? colors.successDim : isNegative ? colors.dangerDim : colors.surface2;
  const DeltaIcon = isPositive ? TrendingUpRoundedIcon : isNegative ? TrendingDownRoundedIcon : TrendingFlatRoundedIcon;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 120px 120px 150px",
        alignItems: "center",
        px: 2,
        py: 1.25,
        bgcolor: index % 2 === 0 ? colors.surface : colors.surface2,
        borderBottom: `1px solid ${colors.border}`,
        transition: "background 0.15s",
        "&:hover": { bgcolor: colors.accentDim },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: ENTITY_DOTS[index % ENTITY_DOTS.length], flexShrink: 0 }}
        />
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: colors.textPrimary }}>{entity}</Typography>
        {cntA === null && (
          <Chip
            label="Only in B"
            size="small"
            sx={{ height: 16, fontSize: "0.55rem", fontWeight: 700, bgcolor: alpha(BATCH_B_ACCENT, 0.12), color: BATCH_B_ACCENT }}
          />
        )}
        {cntB === null && (
          <Chip
            label="Only in A"
            size="small"
            sx={{ height: 16, fontSize: "0.55rem", fontWeight: 700, bgcolor: colors.accentDim, color: colors.accent }}
          />
        )}
      </Stack>

      <Typography
        sx={{ fontSize: "0.82rem", fontWeight: 700, color: cntA !== null ? colors.textPrimary : colors.textDim, fontFamily: "monospace", textAlign: "right" }}
      >
        {cntA !== null ? cntA.toLocaleString() : "—"}
      </Typography>

      <Typography
        sx={{ fontSize: "0.82rem", fontWeight: 700, color: cntB !== null ? colors.textPrimary : colors.textDim, fontFamily: "monospace", textAlign: "right" }}
      >
        {cntB !== null ? cntB.toLocaleString() : "—"}
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        {delta !== null ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ px: 1.25, py: 0.35, borderRadius: colors.radiusL, bgcolor: deltaBg, border: `1px solid ${alpha(deltaColor, 0.25)}` }}
          >
            <DeltaIcon sx={{ fontSize: 13, color: deltaColor }} />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: deltaColor, fontFamily: "monospace" }}>
              {isPositive ? "+" : ""}
              {delta.toLocaleString()}
            </Typography>
            {pctChange && (
              <Typography sx={{ fontSize: "0.62rem", color: alpha(deltaColor, 0.75), fontWeight: 600 }}>({pctChange}%)</Typography>
            )}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: "0.72rem", color: colors.textDim }}>—</Typography>
        )}
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────
// SUMMARY STAT CARD
// ─────────────────────────────────────────────
const SummaryCard: React.FC<{ label: string; value: string | number; color: string; icon: React.ReactNode; colors: Colors }> = ({
  label,
  value,
  color,
  icon,
  colors,
}) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      p: 1.75,
      borderRadius: colors.radiusXL,
      border: `1.5px solid ${alpha(color, 0.25)}`,
      bgcolor: alpha(color, colors.isDark ? 0.1 : 0.05),
      display: "flex",
      flexDirection: "column",
      gap: 0.5,
      minWidth: 0,
    }}
  >
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Box sx={{ color, display: "flex" }}>{icon}</Box>
      <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: alpha(color, 0.85), letterSpacing: 0.7, textTransform: "uppercase" }} noWrap>
        {label}
      </Typography>
    </Stack>
    <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color, letterSpacing: -0.4, fontFamily: "monospace" }}>
      {typeof value === "number" ? value.toLocaleString() : value}
    </Typography>
  </Paper>
);

// ─────────────────────────────────────────────
// MAIN DELTA DIALOG
// ─────────────────────────────────────────────
export const ImpactDeltaDialog: React.FC<ImpactDeltaDialogProps> = ({ open, onClose, crqNo, batches, colors }) => {
  const [batchA, setBatchA] = useState<number | null>(null);
  const [batchB, setBatchB] = useState<number | null>(null);

  const infoA = useMemo(() => batches.find((b) => b.batchNo === batchA) ?? null, [batches, batchA]);
  const infoB = useMemo(() => batches.find((b) => b.batchNo === batchB) ?? null, [batches, batchB]);

  const { data: dataA, isFetching: loadingA, error: errorA } = useGetImpactAnalysisSummaryQuery(
    { crqNo: crqNo as string, batchNo: infoA?.batchNo as number, modifiedDate: infoA?.modifiedDate as string, flag: "Main" },
    { skip: !crqNo || !infoA },
  );
  const { data: dataB, isFetching: loadingB, error: errorB } = useGetImpactAnalysisSummaryQuery(
    { crqNo: crqNo as string, batchNo: infoB?.batchNo as number, modifiedDate: infoB?.modifiedDate as string, flag: "Main" },
    { skip: !crqNo || !infoB },
  );

  const isLoading = loadingA || loadingB;
  const loadError = errorA || errorB;

  const handleSelect = (batchNo: number) => {
    if (batchA === batchNo) return setBatchA(null);
    if (batchB === batchNo) return setBatchB(null);
    if (!batchA) return setBatchA(batchNo);
    if (!batchB) return setBatchB(batchNo);
    setBatchA(batchNo);
  };

  const labelFor = (batchNo: number): "A" | "B" | null => (batchNo === batchA ? "A" : batchNo === batchB ? "B" : null);

  const comparisonRows: ComparisonRow[] = useMemo(() => {
    if (!dataA && !dataB) return [];
    const mapA = new Map((dataA ?? []).map((d) => [d.entity, d.cnt]));
    const mapB = new Map((dataB ?? []).map((d) => [d.entity, d.cnt]));
    const entities = new Set([...mapA.keys(), ...mapB.keys()]);
    return Array.from(entities)
      .sort()
      .map((entity) => ({
        entity,
        cntA: mapA.has(entity) ? (mapA.get(entity) as number) : null,
        cntB: mapB.has(entity) ? (mapB.get(entity) as number) : null,
      }));
  }, [dataA, dataB]);

  const summary = useMemo(() => {
    const increased = comparisonRows.filter((r) => r.cntA !== null && r.cntB !== null && r.cntB > r.cntA).length;
    const decreased = comparisonRows.filter((r) => r.cntA !== null && r.cntB !== null && r.cntB < r.cntA).length;
    const unchanged = comparisonRows.filter((r) => r.cntA !== null && r.cntB !== null && r.cntB === r.cntA).length;
    const totalA = (dataA ?? []).reduce((s, d) => s + d.cnt, 0);
    const totalB = (dataB ?? []).reduce((s, d) => s + d.cnt, 0);
    return { increased, decreased, unchanged, totalA, totalB, totalDelta: totalB - totalA };
  }, [comparisonRows, dataA, dataB]);

  const canCompare = !!batchA && !!batchB && !isLoading && !loadError;
  const dateLabel =
    infoA && infoB
      ? `${formatImpactModifiedDate(infoA.modifiedDate, "dd-MMM-yyyy HH:mm")} → ${formatImpactModifiedDate(infoB.modifiedDate, "dd-MMM-yyyy HH:mm")}`
      : infoA
        ? formatImpactModifiedDate(infoA.modifiedDate, "dd-MMM-yyyy HH:mm")
        : `${batches.length} batch${batches.length === 1 ? "" : "es"} available`;

  const handleClose = () => {
    setBatchA(null);
    setBatchB(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullScreen TransitionComponent={Fade} PaperProps={{ sx: { bgcolor: colors.bg } }}>
      {/* HEADER */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
        <Toolbar sx={{ minHeight: "56px !important", px: 2.5, gap: 2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: colors.radiusL,
              background: `linear-gradient(135deg, ${colors.info} 0%, ${colors.accent} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 4px 12px ${alpha(colors.accent, 0.3)}`,
            }}
          >
            <CompareArrowsRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>

          <Box>
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: colors.textPrimary, lineHeight: 1.2 }}>
              Delta Comparison
            </Typography>
            <Typography sx={{ fontSize: "0.65rem", color: colors.textDim, fontWeight: 500, letterSpacing: 0.3 }}>
              Batch-to-batch impact analysis diff · {dateLabel}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ height: 28, my: "auto", mx: 0.5, opacity: 0.35 }} />

          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography sx={{ fontSize: "0.58rem", color: colors.textDim, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase" }}>
                CRQ Number
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: colors.textPrimary, letterSpacing: -0.2, fontFamily: "monospace" }}>
                {crqNo ?? "—"}
              </Typography>
            </Box>

            {batchA && (
              <Box>
                <Typography sx={{ fontSize: "0.58rem", color: colors.textDim, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase" }}>
                  Batch A
                </Typography>
                <Chip
                  label={`Batch ${batchA}`}
                  size="small"
                  sx={{ height: 20, fontSize: "0.62rem", fontWeight: 800, bgcolor: colors.accentDim, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
                />
              </Box>
            )}

            {batchB && (
              <Box>
                <Typography sx={{ fontSize: "0.58rem", color: colors.textDim, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase" }}>
                  Batch B
                </Typography>
                <Chip
                  label={`Batch ${batchB}`}
                  size="small"
                  sx={{ height: 20, fontSize: "0.62rem", fontWeight: 800, bgcolor: alpha(BATCH_B_ACCENT, 0.12), color: BATCH_B_ACCENT, border: `1px solid ${alpha(BATCH_B_ACCENT, 0.28)}` }}
                />
              </Box>
            )}
          </Stack>

          <Box flex={1} />

          <Tooltip title="Close delta dialog" arrow>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{ bgcolor: colors.dangerDim, color: colors.danger, "&:hover": { bgcolor: alpha(colors.danger, 0.18) }, borderRadius: colors.radius }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>

        {isLoading && (
          <LinearProgress sx={{ height: 2, "& .MuiLinearProgress-bar": { background: `linear-gradient(90deg, ${colors.info}, ${colors.accent})` } }} />
        )}
      </AppBar>

      {/* BODY */}
      <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", overflow: "hidden" }}>
        {/* BATCH SELECTOR BAR */}
        <Box sx={{ bgcolor: colors.surface, borderBottom: `1px solid ${colors.border}`, px: 2.5, py: 1.75, flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
              <LayersRoundedIcon sx={{ fontSize: 15, color: colors.textSecondary }} />
              <Typography sx={{ fontSize: "0.65rem", fontWeight: 800, color: colors.textSecondary, letterSpacing: 0.8, textTransform: "uppercase" }}>
                Select Two Batches to Compare
              </Typography>
            </Stack>

            <Chip
              label={!batchA && !batchB ? "Click to select Batch A" : batchA && !batchB ? "Now select Batch B" : "Both batches selected"}
              size="small"
              icon={batchA && batchB ? <CheckRoundedIcon sx={{ fontSize: 12 }} /> : undefined}
              sx={{
                height: 20,
                fontSize: "0.6rem",
                fontWeight: 700,
                bgcolor: batchA && batchB ? colors.successDim : colors.accentDim,
                color: batchA && batchB ? colors.success : colors.accent,
                border: `1px solid ${batchA && batchB ? colors.successBorder : colors.accentBorder}`,
              }}
            />

            <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5 }}>
              {batches.map((batch, index) => {
                const label = labelFor(batch.batchNo);
                const isSelected = label !== null;
                const colorMain = label === "A" ? colors.accent : label === "B" ? BATCH_B_ACCENT : SLOT_ACCENTS[index % SLOT_ACCENTS.length];

                return (
                  <DeltaBatchPill
                    key={batch.key}
                    label={batch.label}
                    sublabel={formatImpactModifiedDate(batch.modifiedDate)}
                    isSelected={isSelected}
                    selectionLabel={label}
                    colorMain={colorMain}
                    colors={colors}
                    onClick={() => handleSelect(batch.batchNo)}
                  />
                );
              })}
            </Box>

            {(batchA || batchB) && (
              <Button
                size="small"
                startIcon={<SwapHorizRoundedIcon sx={{ fontSize: 14 }} />}
                onClick={() => {
                  setBatchA(null);
                  setBatchB(null);
                }}
                sx={{
                  flexShrink: 0,
                  borderRadius: colors.radiusL,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  bgcolor: colors.surface2,
                  color: colors.textSecondary,
                  "&:hover": { bgcolor: colors.dangerDim, color: colors.danger },
                }}
              >
                Clear
              </Button>
            )}
          </Stack>
        </Box>

        {/* CONTENT */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
          {(!batchA || !batchB) && (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: colors.radiusXL,
                  background: `linear-gradient(135deg, ${alpha(colors.info, 0.1)}, ${alpha(colors.accent, 0.1)})`,
                  border: `1.5px dashed ${alpha(colors.accent, 0.28)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CompareArrowsRoundedIcon sx={{ fontSize: 36, color: alpha(colors.accent, 0.5) }} />
              </Box>
              <Box textAlign="center">
                <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: colors.textSecondary, mb: 0.5 }}>
                  {!batchA ? "Select Batch A to start" : "Now select Batch B to compare"}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", color: colors.textDim }}>
                  Pick two batches from the selector above to see the delta comparison
                </Typography>
              </Box>
            </Box>
          )}

          {batchA && batchB && isLoading && (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
              <CircularProgress size={32} sx={{ color: colors.accent }} />
              <Typography sx={{ fontSize: "0.8rem", color: colors.textDim, fontWeight: 500 }}>Loading batch data for comparison…</Typography>
            </Box>
          )}

          {batchA && batchB && !isLoading && loadError && (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
              <StorageRoundedIcon sx={{ fontSize: 40, color: colors.danger }} />
              <Typography sx={{ fontSize: "0.85rem", color: colors.textSecondary, fontWeight: 600, textAlign: "center" }}>
                {errorMessage(errorA, errorMessage(errorB, "Failed to load one of the selected batches."))}
              </Typography>
            </Box>
          )}

          {canCompare && comparisonRows.length > 0 && (
            <Fade in timeout={350}>
              <Box>
                <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
                  <SummaryCard label="Total A" value={summary.totalA} color={colors.accent} icon={<BarChartRoundedIcon sx={{ fontSize: 15 }} />} colors={colors} />
                  <SummaryCard label="Total B" value={summary.totalB} color={BATCH_B_ACCENT} icon={<BarChartRoundedIcon sx={{ fontSize: 15 }} />} colors={colors} />
                  <SummaryCard
                    label="Net Delta"
                    value={`${summary.totalDelta >= 0 ? "+" : ""}${summary.totalDelta.toLocaleString()}`}
                    color={summary.totalDelta > 0 ? colors.success : summary.totalDelta < 0 ? colors.danger : colors.textDim}
                    icon={
                      summary.totalDelta > 0 ? (
                        <TrendingUpRoundedIcon sx={{ fontSize: 15 }} />
                      ) : summary.totalDelta < 0 ? (
                        <TrendingDownRoundedIcon sx={{ fontSize: 15 }} />
                      ) : (
                        <TrendingFlatRoundedIcon sx={{ fontSize: 15 }} />
                      )
                    }
                    colors={colors}
                  />
                  <SummaryCard label="Increased" value={summary.increased} color={colors.success} icon={<TrendingUpRoundedIcon sx={{ fontSize: 15 }} />} colors={colors} />
                  <SummaryCard label="Decreased" value={summary.decreased} color={colors.danger} icon={<TrendingDownRoundedIcon sx={{ fontSize: 15 }} />} colors={colors} />
                  <SummaryCard label="Unchanged" value={summary.unchanged} color={colors.textDim} icon={<TrendingFlatRoundedIcon sx={{ fontSize: 15 }} />} colors={colors} />
                </Stack>

                <Paper elevation={0} sx={{ border: `1px solid ${colors.border}`, borderRadius: colors.radiusXL, overflow: "hidden" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 150px", px: 2, py: 1, bgcolor: colors.surface2, borderBottom: `1.5px solid ${colors.border}` }}>
                    <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: colors.textDim, letterSpacing: 0.8, textTransform: "uppercase" }}>Entity</Typography>
                    <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: colors.accent, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "right" }}>
                      Batch A · {batchA}
                    </Typography>
                    <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: BATCH_B_ACCENT, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "right" }}>
                      Batch B · {batchB}
                    </Typography>
                    <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: colors.textDim, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "right" }}>
                      Δ Delta
                    </Typography>
                  </Box>

                  {comparisonRows.map((row, i) => (
                    <DeltaRow key={row.entity} row={row} index={i} colors={colors} />
                  ))}

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 150px", px: 2, py: 1.25, bgcolor: colors.surface2, borderTop: `2px solid ${colors.border}` }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: colors.textPrimary }}>TOTAL</Typography>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: colors.accent, fontFamily: "monospace", textAlign: "right" }}>
                      {summary.totalA.toLocaleString()}
                    </Typography>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: BATCH_B_ACCENT, fontFamily: "monospace", textAlign: "right" }}>
                      {summary.totalB.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        sx={{
                          px: 1.25,
                          py: 0.35,
                          borderRadius: colors.radiusL,
                          bgcolor: summary.totalDelta > 0 ? colors.successDim : summary.totalDelta < 0 ? colors.dangerDim : colors.surface,
                          border: `1px solid ${alpha(summary.totalDelta > 0 ? colors.success : summary.totalDelta < 0 ? colors.danger : colors.textDim, 0.25)}`,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            color: summary.totalDelta > 0 ? colors.success : summary.totalDelta < 0 ? colors.danger : colors.textDim,
                            fontFamily: "monospace",
                          }}
                        >
                          {summary.totalDelta >= 0 ? "+" : ""}
                          {summary.totalDelta.toLocaleString()}
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Fade>
          )}

          {canCompare && comparisonRows.length === 0 && (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
              <StorageRoundedIcon sx={{ fontSize: 40, color: colors.textDim }} />
              <Typography sx={{ fontSize: "0.85rem", color: colors.textDim, fontWeight: 600 }}>No data available for the selected batches</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default ImpactDeltaDialog;
