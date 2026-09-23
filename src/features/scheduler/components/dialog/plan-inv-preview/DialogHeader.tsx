import React from "react";
import { Box, Chip, DialogTitle, IconButton, Stack, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import type { ThemeColors } from "../../../types/crq.types";

interface Props {
  crqNo: string | null;
  crqId: string | null;
  isCancelled: boolean;
  colors: ThemeColors;
  onClose: () => void;
}

// crqId stays part of the Props contract (internal plumbing callers still
// pass) but is intentionally not displayed - see "remove visible crqId" work.
export const DialogHeader: React.FC<Props> = (props) => {
  const { crqNo, isCancelled, colors, onClose } = props;
  const theme = useTheme();

  return (
    <DialogTitle sx={{ p: 0, flexShrink: 0, bgcolor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5 }}>
        <Box sx={{
            width: 34, height: 34, borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(colors.accent, 0.18)} 0%, ${alpha(colors.accent, 0.08)} 100%)`,
            border: `1px solid ${alpha(colors.accent, 0.2)}`, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <FactCheckOutlinedIcon sx={{ color: colors.accent, fontSize: 18 }} />
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: 15, color: colors.textPrimary }}>
          CRQ Review
        </Typography>

        <Box sx={{ width: "1px", height: 16, bgcolor: colors.border, display: { xs: "none", sm: "block" } }} />

        <Stack direction="row" spacing={0.75} sx={{ display: { xs: "none", sm: "flex" } }}>
          {crqNo && (
            <Chip label={crqNo} size="small" sx={{
              height: 22, fontWeight: 600, fontSize: 10.5, bgcolor: alpha(colors.accent, 0.1), color: colors.accent, border: `1px solid ${alpha(colors.accent, 0.2)}`
            }} />
          )}
          {isCancelled && (
            <Chip label="Cancelled" size="small" sx={{
              height: 22, fontSize: 10.5, bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main, border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`, fontWeight: 600
            }} />
          )}
        </Stack>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Close" arrow>
          <IconButton onClick={onClose} size="small" sx={{ color: colors.textSecondary, width: 30, height: 30, borderRadius: 1.5 }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </DialogTitle>
  );
};