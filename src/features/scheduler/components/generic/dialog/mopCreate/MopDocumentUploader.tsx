import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Stack, Tooltip, Typography, alpha } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { toast } from "react-toastify";
import {
  useGetMopCreatePdfQuery,
  useUploadMopCreatePdfMutation,
} from "../../../../api/mopDocumentApiSlice";
import {
  MOP_ACCEPT_ATTR,
  MOP_EXTENSION,
  MOP_PDF_MAX_BYTES,
  MOP_TYPE_LABEL,
  type MopDocumentType,
} from "../../../../types/mopDocument.types";
import { MopPdfPreview } from "./MopPdfPreview";
import { MopExcelPreview } from "./MopExcelPreview";

interface MopDocumentUploaderProps {
  crqNo: string;
  /** True when the backend already has a document stored for this CRQ. */
  attached: boolean;
  /** Format of that document - decides which viewer mounts. */
  documentType: MopDocumentType | null;
  /** Cancelled / already-Done / view-only - nothing here may write. */
  readOnly: boolean;
  colors: any;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / (1024 * 1024);
  // Whole megabytes read as limits ("up to 25 MB"), fractions as measurements
  // ("2.4 MB") - a "25.0 MB" ceiling looks like a measured value it isn't.
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
};

/** Extension-based, for a file the user just picked - the backend re-checks
 *  the actual magic bytes and is the authority. */
const localKindOf = (file: File): MopDocumentType | null => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "PDF";
  if (name.endsWith(".xlsx")) return "XLSX";
  if (name.endsWith(".xls")) return "XLS";
  return null;
};

/**
 * The MOP document half of the panel: a one-line action row, and below it the
 * stored document or the drop zone filling the panel's remaining height.
 *
 * A MOP may be a PDF or an Excel workbook. `CRQ_PDF_TBL` keys on `CRQ_NO`
 * alone and `SP_STORE_CRQ_MOP_CREATE_PDF` upserts on it, so a CRQ carries one
 * MOP in one format - uploading either kind replaces what was there. That is
 * also why there is no "remove" for a *stored* document: no procedure deletes
 * from that table, so a delete button here could only lie. The clear (X)
 * button appears solely on a locally staged file that has not been sent yet.
 */
export const MopDocumentUploader: React.FC<MopDocumentUploaderProps> = ({
  crqNo,
  attached,
  documentType,
  readOnly,
  colors,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which of the two fill-height bodies is showing. A stored document opens
  // straight into its preview - that is the thing the reviewer came for, and
  // making them press "Preview" first would cost the one-view read for
  // nothing. "Replace" is what swaps back to the drop zone.
  const [showPreview, setShowPreview] = useState(true);

  const [uploadPdf, { isLoading: isUploading }] = useUploadMopCreatePdfMutation();

  // .xls is fetched only on demand (download / new tab): nothing can render
  // it inline, so pulling it down just to open the preview would spend a
  // round trip on a viewer that is never mounted.
  const isLegacyXls = documentType === "XLS";
  const {
    data: blob,
    isFetching: isFetchingDoc,
    isError: isDocError,
    refetch: refetchDoc,
  } = useGetMopCreatePdfQuery(crqNo, { skip: !attached || (!showPreview && !isLegacyXls) });

  // A CRQ with no document has nothing to preview - land on the drop zone,
  // and go back to the preview once one exists (including right after an
  // upload, so the reviewer sees what they just stored).
  useEffect(() => {
    setShowPreview(attached);
  }, [attached, crqNo]);

  // Mirrors the backend's own guards so an obviously-bad file is rejected
  // without spending a round trip on it. The backend still re-checks both,
  // against the content rather than the name - this is a convenience, not
  // the enforcement point.
  const validate = useCallback((file: File): string | null => {
    if (!localKindOf(file)) {
      return `"${file.name}" is not a PDF or Excel workbook. Upload the MOP as a .pdf, .xlsx or .xls file.`;
    }
    if (file.size === 0) return `"${file.name}" is empty.`;
    if (file.size > MOP_PDF_MAX_BYTES) {
      return `"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(MOP_PDF_MAX_BYTES)}.`;
    }
    return null;
  }, []);

  const stage = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const problem = validate(file);
      setError(problem);
      setStaged(problem ? null : file);
    },
    [validate],
  );

  const clearStaged = () => {
    setStaged(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!staged) return;
    try {
      await uploadPdf({ crqNo, file: staged }).unwrap();
      toast.success(`MOP document stored for ${crqNo}.`);
      clearStaged();
      setShowPreview(true);
    } catch (e: any) {
      // The backend answers 400 with the reason (wrong type, too large,
      // unknown CRQ) - show it against the drop zone rather than as a toast
      // that scrolls away from the control that caused it.
      setError(e?.data?.message ?? "The MOP document could not be stored.");
    }
  };

  // Downloading and opening in a tab both go through the authenticated
  // endpoint, so they reuse the blob already fetched for the preview rather
  // than linking the API path directly (which would arrive unauthenticated).
  const withObjectUrl = (fn: (url: string) => void) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    fn(url);
    // Revoked on a timeout, not immediately: a new tab has not finished
    // reading the URL by the time this returns.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleDownload = () =>
    withObjectUrl((url) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = `${crqNo}-mop.${MOP_EXTENSION[documentType ?? "PDF"]}`;
      link.click();
    });

  const handleOpenTab = () => withObjectUrl((url) => window.open(url, "_blank", "noopener"));

  const uploadDisabled = readOnly || isUploading;
  const stagedKind = staged ? localKindOf(staged) : null;
  const isExcel = documentType === "XLSX" || documentType === "XLS";
  const actionBtn = {
    textTransform: "none",
    fontSize: 12.5,
    fontWeight: 600,
    borderRadius: 1.5,
    px: 1.4,
    minWidth: 0,
    whiteSpace: "nowrap",
  } as const;

  const KindIcon = staged
    ? stagedKind === "PDF"
      ? PictureAsPdfOutlinedIcon
      : stagedKind
        ? GridOnOutlinedIcon
        : InsertDriveFileOutlinedIcon
    : !attached
      ? DescriptionOutlinedIcon
      : isExcel
        ? GridOnOutlinedIcon
        : PictureAsPdfOutlinedIcon;

  const kindColor = staged
    ? colors.accent
    : !attached
      ? colors.textDim
      : isExcel
        ? colors.success
        : colors.danger;

  const storedName = attached
    ? `${crqNo}-mop.${MOP_EXTENSION[documentType ?? "PDF"]}`
    : "No MOP attached";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 1.25 }}>
      <input
        ref={inputRef}
        type="file"
        accept={MOP_ACCEPT_ATTR}
        hidden
        onChange={(e) => stage(e.target.files?.[0])}
      />

      {/* One action row, whatever the state - the controls never move
          between rows as the state changes. */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          border: `1px solid ${staged ? colors.accentBorder : colors.border}`,
          bgcolor: staged ? colors.accentDim : colors.surface,
          borderRadius: 2,
          px: 1.5,
          py: 1,
          flexShrink: 0,
        }}
      >
        <KindIcon sx={{ fontSize: 20, color: kindColor, flex: "none" }} />

        <Box sx={{ flex: "1 1 160px", minWidth: 0 }}>
          <Typography
            title={staged ? staged.name : undefined}
            sx={{
              fontWeight: 600,
              fontSize: 13,
              lineHeight: 1.4,
              color: colors.textPrimary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {staged ? staged.name : storedName}
          </Typography>
          <Typography sx={{ fontSize: 11, lineHeight: 1.4, color: colors.textSecondary }}>
            {staged
              ? `${formatBytes(staged.size)} · ready to upload`
              : attached
                ? "Stored against this CRQ · uploading again replaces it"
                : `PDF or Excel · up to ${formatBytes(MOP_PDF_MAX_BYTES)} · one document per CRQ`}
          </Typography>
        </Box>

        {attached && !staged && documentType && (
          <Chip
            label={MOP_TYPE_LABEL[documentType]}
            size="small"
            sx={{
              height: 20,
              fontSize: 10,
              fontWeight: 700,
              bgcolor: alpha(isExcel ? colors.success : colors.danger, 0.15),
              color: isExcel ? colors.success : colors.danger,
            }}
          />
        )}

        {staged ? (
          <>
            <Button
              size="small"
              variant="contained"
              onClick={handleUpload}
              disabled={uploadDisabled}
              startIcon={
                isUploading ? (
                  <CircularProgress size={13} color="inherit" />
                ) : (
                  <UploadFileOutlinedIcon sx={{ fontSize: "16px !important" }} />
                )
              }
              sx={{
                ...actionBtn,
                bgcolor: colors.accent,
                "&:hover": { bgcolor: colors.accent, filter: "brightness(1.08)" },
              }}
            >
              {isUploading ? "Uploading…" : attached ? "Replace" : "Upload"}
            </Button>
            <Tooltip title="Clear selection" arrow>
              <span>
                <Button
                  size="small"
                  onClick={clearStaged}
                  disabled={isUploading}
                  aria-label="Clear selection"
                  sx={{ ...actionBtn, px: 0.75, color: colors.textSecondary }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </Button>
              </span>
            </Tooltip>
          </>
        ) : (
          <>
            {attached && !isLegacyXls && (
              <Button
                size="small"
                variant={showPreview ? "text" : "contained"}
                onClick={() => setShowPreview((v) => !v)}
                startIcon={
                  showPreview ? (
                    <VisibilityOffOutlinedIcon sx={{ fontSize: "16px !important" }} />
                  ) : isExcel ? (
                    <GridOnOutlinedIcon sx={{ fontSize: "16px !important" }} />
                  ) : (
                    <PictureAsPdfOutlinedIcon sx={{ fontSize: "16px !important" }} />
                  )
                }
                sx={{
                  ...actionBtn,
                  ...(showPreview
                    ? { color: colors.textSecondary }
                    : {
                        bgcolor: colors.accent,
                        "&:hover": { bgcolor: colors.accent, filter: "brightness(1.08)" },
                      }),
                }}
              >
                {showPreview ? "Hide preview" : isExcel ? "Preview Excel" : "Preview PDF"}
              </Button>
            )}
            {attached && (
              <>
                <Tooltip title="Open in a new tab" arrow>
                  <span>
                    <Button
                      size="small"
                      onClick={handleOpenTab}
                      disabled={!blob}
                      aria-label="Open MOP in a new tab"
                      sx={{ ...actionBtn, px: 0.75, color: colors.textSecondary }}
                    >
                      <OpenInFullRoundedIcon sx={{ fontSize: 16 }} />
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Download" arrow>
                  <span>
                    <Button
                      size="small"
                      onClick={handleDownload}
                      disabled={!blob}
                      aria-label="Download MOP"
                      sx={{ ...actionBtn, px: 0.75, color: colors.textSecondary }}
                    >
                      <DownloadRoundedIcon sx={{ fontSize: 17 }} />
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}
            <Button
              size="small"
              variant={attached ? "outlined" : "contained"}
              onClick={() => {
                setShowPreview(false);
                inputRef.current?.click();
              }}
              disabled={uploadDisabled}
              startIcon={
                attached ? (
                  <SwapHorizRoundedIcon sx={{ fontSize: "16px !important" }} />
                ) : (
                  <UploadFileOutlinedIcon sx={{ fontSize: "16px !important" }} />
                )
              }
              sx={{
                ...actionBtn,
                ...(attached
                  ? { color: colors.textPrimary, borderColor: colors.border }
                  : {
                      bgcolor: colors.accent,
                      "&:hover": { bgcolor: colors.accent, filter: "brightness(1.08)" },
                    }),
              }}
            >
              {attached ? "Replace" : "Attach MOP"}
            </Button>
          </>
        )}
      </Box>

      {isUploading && <LinearProgress sx={{ height: 3, borderRadius: 2, flexShrink: 0 }} />}

      {error && (
        <Alert severity="error" sx={{ fontSize: 12.5, py: 0.25, flexShrink: 0 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Fill-height body: the stored document in its own viewer, or the drop
          zone. Exactly one is mounted, so the panel is always the same height
          and never scrolls. */}
      {attached && showPreview && !staged ? (
        isLegacyXls ? (
          // exceljs reads .xlsx, not the legacy .xls (BIFF) container, and no
          // browser renders it either. Saying so beats mounting a viewer that
          // would only fail.
          <Stack
            sx={{
              flex: 1,
              minHeight: 132,
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              bgcolor: colors.surface,
              p: 3,
            }}
            spacing={1.5}
          >
            <GridOnOutlinedIcon sx={{ fontSize: 30, color: colors.success }} />
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>
              Legacy .xls workbook
            </Typography>
            <Typography sx={{ fontSize: 12, color: colors.textDim, maxWidth: 360 }}>
              This format can't be shown in the browser. Download it to open in Excel, or re-upload
              the MOP as .xlsx to preview it here.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDownload}
              disabled={!blob}
              startIcon={<DownloadRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}
            >
              Download workbook
            </Button>
          </Stack>
        ) : isExcel ? (
          <MopExcelPreview
            blob={blob}
            isFetching={isFetchingDoc}
            isError={isDocError}
            onRetry={refetchDoc}
            colors={colors}
          />
        ) : (
          <MopPdfPreview
            crqNo={crqNo}
            blob={blob}
            isFetching={isFetchingDoc}
            isError={isDocError}
            onRetry={refetchDoc}
            colors={colors}
          />
        )
      ) : (
        <Box
          onClick={() => !uploadDisabled && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploadDisabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!uploadDisabled) stage(e.dataTransfer.files?.[0]);
          }}
          sx={{
            flex: 1,
            minHeight: 132,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            border: `2px dashed ${dragging ? colors.accent : colors.border}`,
            borderRadius: 2,
            bgcolor: dragging ? alpha(colors.accent, 0.05) : colors.surface,
            textAlign: "center",
            p: 2,
            cursor: uploadDisabled ? "not-allowed" : "pointer",
            opacity: uploadDisabled ? 0.55 : 1,
            transition: "border-color 150ms, background-color 150ms",
            "&:hover": uploadDisabled
              ? undefined
              : { borderColor: colors.accent, bgcolor: alpha(colors.accent, 0.04) },
          }}
        >
          <Stack direction="row" spacing={1.25} sx={{ color: colors.accent }}>
            <PictureAsPdfOutlinedIcon sx={{ fontSize: 26 }} />
            <GridOnOutlinedIcon sx={{ fontSize: 26 }} />
          </Stack>
          <Typography sx={{ fontWeight: 700, fontSize: 14.5, color: colors.textPrimary, mt: 0.5 }}>
            {staged
              ? "Drop another file to swap the selection"
              : attached
                ? "Drop a replacement MOP here"
                : "Drop the MOP here"}
          </Typography>
          <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
            or click to browse · PDF or Excel (.pdf, .xlsx, .xls) · up to{" "}
            {formatBytes(MOP_PDF_MAX_BYTES)}
          </Typography>
          {attached && !staged && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(true);
              }}
              sx={{ ...actionBtn, mt: 0.5, color: colors.accent }}
            >
              Back to preview
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MopDocumentUploader;
