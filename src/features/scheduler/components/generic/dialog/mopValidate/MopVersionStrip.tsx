import React from "react";
import { Box, Chip, Skeleton, Typography, alpha } from "@mui/material";
import {
  MOP_VERSION_STATUS_LABEL,
  type MopValidateDetails,
  type MopVersionStatus,
} from "../../../../types/mopValidate.types";

interface MopVersionStripProps {
  details?: MopValidateDetails;
  loading: boolean;
  colors: any;
}

/** `2026-09-04T10:43:43` -> `04 Sep 2026, 10:43`, or the raw value if unparseable. */
export const formatStamp = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return value;
  return at.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatBytes = (bytes: number | null | undefined): string | null => {
  if (bytes == null) return null;
  // The create procedure writes a mop_file placeholder with size_bytes = 0
  // before any bytes exist, so zero means "no document yet", not "empty file".
  if (bytes === 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Which colour a version status earns. Only a decided version is green or red;
 * everything still in flight reads as the neutral accent, so the strip never
 * implies an outcome that has not been reached.
 */
const statusColor = (status: MopVersionStatus, colors: any): string => {
  if (status === "validated") return colors.success;
  if (status === "rejected") return colors.danger;
  if (status === "superseded") return colors.textDim;
  return colors.accent;
};

/**
 * The read-only facts about the CRQ's current MOP version, above the review
 * controls - version number, status, when it was uploaded, its page count and
 * its document.
 *
 * Same one-line wrapping strip as MOP Create's header rather than a grid of
 * cards, for the same reason: these are short values, and a bordered box each
 * would cost three rows of height the panel below needs more. Nulls are
 * expected here (page count is never measured, `uploaded_by` is null on a
 * procedure-created v1) and render as a dash rather than being hidden, so they
 * populate on their own once that data lands.
 */
export const MopVersionStrip: React.FC<MopVersionStripProps> = ({ details, loading, colors }) => {
  const status = details?.versionStatus ?? null;

  const items: Array<{ label: string; value: string | null; grow?: boolean; mono?: boolean }> = [
    { label: "CRQ", value: details?.crqNo ?? null, mono: true },
    {
      label: "Version",
      value: details?.versionNo != null ? `v${details.versionNo}` : null,
      mono: true,
    },
    { label: "Uploaded", value: formatStamp(details?.uploadedAt), mono: true },
    { label: "Pages", value: details?.pageCount != null ? String(details.pageCount) : null, mono: true },
    { label: "Document", value: details?.fileName ?? null, grow: true },
    { label: "Size", value: formatBytes(details?.sizeBytes) },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "stretch",
        rowGap: 1,
        border: `1px solid ${colors.border}`,
        borderRadius: 2,
        bgcolor: colors.surface,
        px: 1.75,
        py: 1,
        flexShrink: 0,
      }}
    >
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && (
            <Box
              aria-hidden
              sx={{ width: "1px", bgcolor: colors.border, mx: 1.75, alignSelf: "stretch" }}
            />
          )}
          <Box sx={{ minWidth: 0, flex: item.grow ? "1 1 180px" : "0 1 auto" }}>
            <Typography
              sx={{
                fontSize: 9.5,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: colors.textSecondary,
                lineHeight: 1.5,
              }}
            >
              {item.label}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} sx={{ fontSize: 13 }} />
            ) : (
              <Typography
                title={item.value ?? undefined}
                sx={{
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  fontWeight: item.value ? 600 : 400,
                  color: item.value ? colors.textPrimary : colors.textDim,
                  fontVariantNumeric: item.mono ? "tabular-nums" : undefined,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.value || "—"}
              </Typography>
            )}
          </Box>
        </React.Fragment>
      ))}

      {!loading && status && (
        <>
          <Box
            aria-hidden
            sx={{ width: "1px", bgcolor: colors.border, mx: 1.75, alignSelf: "stretch" }}
          />
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Chip
              label={MOP_VERSION_STATUS_LABEL[status] ?? status}
              size="small"
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: alpha(statusColor(status, colors), 0.15),
                color: statusColor(status, colors),
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default MopVersionStrip;
