import React from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { usePdfObjectUrl } from "../../../../hook/usePdfObjectUrl";

interface MopPdfPreviewProps {
  crqNo: string;
  blob?: Blob;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  colors: any;
}

/**
 * The stored MOP rendered inline, filling whatever height the panel has left.
 *
 * An `<iframe>` on a `blob:` URL, not a JS renderer: the browser's own PDF
 * viewer already brings paging, zoom, search, rotate and print, which is the
 * whole toolbar the design draws by hand - and it costs no bundle. `react-pdf`
 * is in package.json but unused, and wiring its worker would buy a worse
 * viewer here. Loading and failure both render at full height so the panel's
 * layout never jumps between states.
 */
export const MopPdfPreview: React.FC<MopPdfPreviewProps> = ({
  crqNo,
  blob,
  isFetching,
  isError,
  onRetry,
  colors,
}) => {
  const { url, isMalformed } = usePdfObjectUrl(blob);

  const frame = {
    flex: 1,
    minHeight: 0,
    border: `1px solid ${colors.border}`,
    borderRadius: 2,
    overflow: "hidden",
    bgcolor: colors.surface,
  } as const;

  if (isFetching) {
    return (
      <Stack sx={{ ...frame, alignItems: "center", justifyContent: "center" }} spacing={1.2}>
        <CircularProgress size={24} />
        <Typography sx={{ fontSize: 12.5, color: colors.textDim, fontWeight: 600 }}>
          Loading MOP…
        </Typography>
      </Stack>
    );
  }

  if (isError || isMalformed) {
    return (
      <Stack
        sx={{ ...frame, alignItems: "center", justifyContent: "center", p: 3, textAlign: "center" }}
        spacing={1.5}
      >
        <ErrorOutlineRoundedIcon sx={{ fontSize: 30, color: colors.danger }} />
        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>
          Unable to load the MOP document.
        </Typography>
        <Typography sx={{ fontSize: 12, color: colors.textDim, maxWidth: 340 }}>
          {isMalformed
            ? "The stored document is corrupted or is not a valid PDF. Upload it again to replace it."
            : "The document could not be fetched. Try again, or upload it again to replace it."}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={onRetry}
          startIcon={<RefreshRoundedIcon sx={{ fontSize: 15 }} />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}
        >
          Retry
        </Button>
      </Stack>
    );
  }

  if (!url) return <Box sx={frame} />;

  return (
    <Box sx={frame}>
      <iframe
        title={`MOP document for ${crqNo}`}
        src={url}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
      />
    </Box>
  );
};

export default MopPdfPreview;
