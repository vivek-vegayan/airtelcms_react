import React from "react";
import { Box, Chip, Skeleton, Typography, alpha } from "@mui/material";
import {
  MOP_STATUS_LABEL,
  type MopCreateDetails,
} from "../../../../types/mopDocument.types";

interface MopDetailsStripProps {
  details?: MopCreateDetails;
  loading: boolean;
  colors: any;
}

/**
 * `2026-09-04T09:48:19` -> `04 Sep 2026, 09:48`. The backend serialises
 * LocalDateTime as ISO-8601 (`write-dates-as-timestamps=false`), so this is a
 * plain Date parse - but an unparseable value is shown as-is rather than as
 * "Invalid Date".
 */
const formatWindow = (value: string | null | undefined): string | null => {
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

/**
 * The read-only CRQ facts above the document - exactly the six columns
 * `SP_GET_MOP_DETAILS_BY_CRQN` returns (`crq_number`, `title`, `window_start`,
 * `window_end`, `region`, `vendor`), read back off the `mop` row that
 * procedure writes.
 *
 * Laid out as one wrapping strip rather than a grid of cards: these are short
 * values, and giving each its own bordered box cost three rows of height that
 * the document preview underneath needs far more. The strip is the panel's
 * only fixed-height element, so everything below it can fill.
 *
 * The design draws these as editable inputs, but no write-back procedure
 * exists, so they are rendered as values rather than as fields that would
 * silently discard an edit. Window, region and vendor are routinely null today
 * (region and vendor come from `CRQ_DETAIL_TBL`, which is empty; the window
 * needs a current `CRQ_SCHEDULE_TBL` row) - they are kept visible with a dash
 * instead of being hidden, so they populate on their own once that data lands
 * rather than needing this component changed again.
 */
export const MopDetailsStrip: React.FC<MopDetailsStripProps> = ({ details, loading, colors }) => {
  const items: Array<{ label: string; value: string | null | undefined; grow?: boolean; mono?: boolean }> = [
    { label: "CRQ", value: details?.crqNo, mono: true },
    { label: "Title", value: details?.title, grow: true },
    { label: "Window start", value: formatWindow(details?.windowStart), mono: true },
    { label: "Window end", value: formatWindow(details?.windowEnd), mono: true },
    { label: "Region", value: details?.region },
    { label: "Vendor", value: details?.vendor },
  ];

  const status = details?.mopStatus;

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
              <Skeleton variant="text" width={90} sx={{ fontSize: 13 }} />
            ) : (
              <Typography
                title={item.value ?? undefined}
                sx={{
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  fontWeight: item.value ? 600 : 400,
                  // Nulls are expected here, not a failure - they read as an
                  // absent value rather than an empty slot.
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

      {/* Only once the MOP record exists - before that there is no status to
          report, and the panel says so in its own banner instead. */}
      {!loading && status && (
        <>
          <Box
            aria-hidden
            sx={{ width: "1px", bgcolor: colors.border, mx: 1.75, alignSelf: "stretch" }}
          />
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Chip
              label={MOP_STATUS_LABEL[status] ?? status}
              size="small"
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: alpha(
                  status === "validated"
                    ? colors.success
                    : status === "rejected" || status === "cancelled"
                      ? colors.danger
                      : colors.accent,
                  0.15,
                ),
                color:
                  status === "validated"
                    ? colors.success
                    : status === "rejected" || status === "cancelled"
                      ? colors.danger
                      : colors.accent,
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default MopDetailsStrip;
