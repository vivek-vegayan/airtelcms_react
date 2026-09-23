import React, { useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

import { SlideUpTransition } from "../../../../../components/common/SlideUpTransition";
import type { Colors } from "../../../types/colorTypes";
import { useLazyGetCrqPlanPdfQuery } from "../../../api/crqreviewApiSlice";
import { usePdfObjectUrl } from "../../../hook/usePdfObjectUrl";

export interface PreviewCrqPdfDialogProps {
  open: boolean;
  onClose: () => void;
  crqNo: string | null;
  colors: Colors;
}

/**
 * "Preview CRQ" - fetches the change plan PDF (Get_Change_PlanPDF via
 * GET /crqworkflow/{crqNo}/plan-pdf) only once the dialog actually opens,
 * and only for the CRQ it was opened for - triggered from every StageRail
 * card and from PrevCrqStatusDialog's footer, all sharing this one dialog.
 */
export const PreviewCrqPdfDialog: React.FC<PreviewCrqPdfDialogProps> = ({
  open,
  onClose,
  crqNo,
  colors,
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [trigger, { data: blob, isFetching, isError }] = useLazyGetCrqPlanPdfQuery();
  const { url: pdfUrl, isMalformed } = usePdfObjectUrl(blob);

  useEffect(() => {
    if (open && crqNo) trigger(crqNo);
  }, [open, crqNo, trigger]);

  const handleRetry = () => {
    if (crqNo) trigger(crqNo);
  };

  const handleDownload = () => {
    if (!pdfUrl || !crqNo) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${crqNo}.pdf`;
    a.click();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={isSmall}
      TransitionComponent={SlideUpTransition}
      PaperProps={{
        elevation: 0,
        sx: {
          height: isSmall ? "100%" : "calc(100vh - 120px)",
          maxHeight: isSmall ? "100%" : "calc(100vh - 120px)",
          borderRadius: isSmall ? 0 : colors.radiusXL,
          border: `1px solid ${colors.border}`,
          bgcolor: colors.bg,
        },
      }}
    >
      <DialogTitle
        sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${colors.border}`, bgcolor: colors.surface, flexShrink: 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <PictureAsPdfOutlinedIcon sx={{ fontSize: 20, color: colors.accent }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: colors.textPrimary }}>
              Preview CRQ
            </Typography>
            {crqNo && (
              <Typography sx={{ fontSize: 11.5, color: colors.textDim, fontFamily: "monospace" }} noWrap>
                CRQ: {crqNo}
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Close">
            <IconButton size="small" aria-label="Close" onClick={onClose}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{ p: 0, bgcolor: colors.bg, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {isFetching && (
          <Stack alignItems="center" justifyContent="center" spacing={1.2} sx={{ flex: 1, p: 4 }}>
            <CircularProgress size={26} />
            <Typography sx={{ fontSize: 12.5, color: colors.textDim, fontWeight: 600 }}>
              Loading PDF…
            </Typography>
            <Skeleton variant="rounded" width="70%" height={14} sx={{ borderRadius: colors.radius }} />
            <Skeleton variant="rounded" width="50%" height={14} sx={{ borderRadius: colors.radius }} />
          </Stack>
        )}

        {!isFetching && (isError || isMalformed) && (
          <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ flex: 1, p: 4, textAlign: "center" }}>
            <ErrorOutlineRoundedIcon sx={{ fontSize: 32, color: colors.danger }} />
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>
              Unable to load the CRQ preview.
            </Typography>
            <Typography sx={{ fontSize: 12, color: colors.textDim, maxWidth: 340 }}>
              {isMalformed
                ? "The stored plan document for this CRQ is corrupted or not a valid PDF. Please re-upload it."
                : "Please try again. If the problem continues, no plan document may have been uploaded for this CRQ yet."}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={handleRetry}
              startIcon={<RefreshRoundedIcon sx={{ fontSize: 15 }} />}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
            >
              Retry
            </Button>
          </Stack>
        )}

        {!isFetching && !isError && !isMalformed && pdfUrl && (
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <iframe
              title={`Preview CRQ ${crqNo ?? ""}`}
              src={pdfUrl}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${colors.border}`, bgcolor: colors.surface, gap: 1, flexShrink: 0 }}
      >
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}>
          Close
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          onClick={handleDownload}
          disabled={!pdfUrl}
          startIcon={<DownloadRoundedIcon sx={{ fontSize: 17 }} />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", px: 2.2 }}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewCrqPdfDialog;
