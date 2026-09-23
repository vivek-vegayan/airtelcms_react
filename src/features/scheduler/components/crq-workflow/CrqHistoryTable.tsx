import React from "react";
import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { format } from "date-fns";
import type { Colors } from "../../types/colorTypes";
import type { StageHistoryEntry } from "../../types/crqWorkflow.types";

interface CrqHistoryTableProps {
  history: StageHistoryEntry[] | null | undefined;
  colors: Colors;
}

const fmt = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "dd-MMM-yyyy HH:mm");
};

const statusPalette = (status: string | null | undefined, colors: Colors) => {
  const s = (status ?? "").toLowerCase();
  if (s.includes("done") || s.includes("complete"))
    return { bg: colors.successDim, fg: colors.success };
  if (s.includes("fail") || s.includes("cancel"))
    return { bg: colors.dangerDim, fg: colors.danger };
  if (s.includes("progress"))
    return { bg: colors.infoDim, fg: colors.info };
  if (s.includes("pause") || s.includes("hold"))
    return { bg: colors.warningDim, fg: colors.warning };
  return { bg: colors.trackOff, fg: colors.textDim };
};

/**
 * Compact, sticky-header history table for the CrqDetailedView cockpit only.
 * A page-local sibling of StageHistoryPanel (not a replacement) - that
 * component is still used as-is by PrevCrqStatusDialog/StageCard/CrqCard, so
 * it's left untouched; this one exists purely to give the workflow cockpit's
 * own history section a denser, table-shaped layout instead of stacked cards.
 */
export const CrqHistoryTable: React.FC<CrqHistoryTableProps> = ({ history, colors }) => {
  const currentIdx = history?.findIndex((h) => h.current) ?? -1;
  const entries = (history ?? []).filter(
    (h, i) => !h.current && (currentIdx === -1 || i < currentIdx),
  );

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1 }}>
        <HistoryRoundedIcon sx={{ fontSize: 15, color: colors.textDim }} />
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.55,
            textTransform: "uppercase",
            color: colors.textSecondary,
          }}
        >
          Previous Stages
        </Typography>
        <Chip
          icon={<LockOutlinedIcon sx={{ fontSize: "12px !important" }} />}
          label="History · Read-only"
          size="small"
          sx={{
            height: 20,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: colors.trackOff,
            color: colors.textDim,
            border: `1px solid ${colors.border}`,
            "& .MuiChip-icon": { color: colors.textDim },
          }}
        />
      </Stack>

      {!entries.length ? (
        <Box
          sx={{
            p: 2,
            textAlign: "center",
            border: `1px dashed ${colors.border}`,
            borderRadius: colors.radiusL,
          }}
        >
          <Typography sx={{ fontSize: 12.5, color: colors.textDim }}>
            No previous-stage history for this CRQ yet.
          </Typography>
        </Box>
      ) : (
        <TableContainer
          sx={{
            maxHeight: 260,
            border: `1px solid ${colors.border}`,
            borderRadius: colors.radiusL,
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {["Stage", "Status", "Started → Completed", "Performed By"].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      color: colors.textDim,
                      bgcolor: colors.surface2,
                      borderBottom: `1px solid ${colors.border}`,
                      py: 0.75,
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => {
                const pal = statusPalette(entry.status, colors);
                return (
                  <TableRow key={entry.stage} hover>
                    <TableCell
                      sx={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, py: 0.6 }}
                    >
                      {entry.stageLabel ?? entry.stage}
                    </TableCell>
                    <TableCell sx={{ py: 0.6 }}>
                      <Chip
                        label={entry.status ?? "—"}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10.5,
                          fontWeight: 800,
                          bgcolor: pal.bg,
                          color: pal.fg,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11.5, color: colors.textSecondary, py: 0.6, whiteSpace: "nowrap" }}>
                      {fmt(entry.startedAt)} → {fmt(entry.completedAt)}
                    </TableCell>
                    <TableCell sx={{ fontSize: 11.5, fontFamily: "monospace", color: colors.textSecondary, py: 0.6 }}>
                      {entry.performedBy ?? entry.assignedTo ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CrqHistoryTable;
