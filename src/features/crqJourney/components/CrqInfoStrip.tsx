import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import type { CrqDetailsInfo, CrqJourneySearchRow } from "../types/crqJourney.types";
import { formatDateTime, formatStatusLabel, statusChipColor } from "../utils/crqJourney.utils";

interface CrqInfoStripProps {
  info: CrqJourneySearchRow;
  /** Result set 1 of get_crq_details — enriches the strip once it lands; the strip renders without it. */
  details?: CrqDetailsInfo | null;
  isLoadingDetails?: boolean;
  progress?: { completed: number; total: number; pct: number } | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** Opens the CRQ-level SPOC / Field Engineer dialog. Omitted -> the button is not rendered. */
  onViewSpocFe?: () => void;
}

const MetaItem: React.FC<{
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  loading?: boolean;
}> = ({ icon: Icon, label, children, loading }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", gap: 1, minWidth: 0, alignItems: "flex-start" }}>
      <Box
        sx={{
          flexShrink: 0,
          width: 26,
          height: 26,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(13,27,42,0.04)",
        }}
      >
        <Icon sx={{ fontSize: 14, color: "text.secondary" }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 10,
            color: "text.disabled",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            lineHeight: 1.4,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width={86} height={16} />
        ) : (
          <Box sx={{ fontSize: 12.5, fontWeight: 500, color: "text.primary", lineHeight: 1.35, minWidth: 0 }}>
            {children}
          </Box>
        )}
      </Box>
    </Box>
  );
};

const Truncated: React.FC<{ value: string }> = ({ value }) => (
  <Tooltip title={value} arrow enterDelay={500}>
    <Box
      component="span"
      sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
    >
      {value}
    </Box>
  </Tooltip>
);

export const CrqInfoStrip: React.FC<CrqInfoStripProps> = ({
  info,
  details,
  isLoadingDetails = false,
  progress,
  onRefresh,
  isRefreshing = false,
  onViewSpocFe,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const chip = statusChipColor(info.currentStatus, isDark);

  const remark = details?.remark?.trim();

  return (
    <Box
      sx={{
        borderRadius: "14px",
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.35)" : "0 1px 3px rgba(16,40,70,0.05)",
        overflow: "hidden",
      }}
    >
      {/* ── identity row ── */}
      <Box
        sx={{
          px: { xs: 1.5, md: 2 },
          py: 0.85,
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, md: 1.5 },
          flexWrap: "wrap",
          background: chip.bg,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          sx={{
            fontFamily: "Roboto Mono, monospace",
            fontSize: { xs: 13, md: 14.5 },
            fontWeight: 700,
            color: theme.palette.primary.main,
            wordBreak: "break-all",
          }}
        >
          {info.crqNo}
        </Typography>

        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            height: 24,
            fontSize: 11.5,
            fontWeight: 700,
            color: chip.color,
            background: theme.palette.background.paper,
            border: `1px solid ${alpha(chip.color, 0.25)}`,
            borderRadius: "999px",
            px: "10px",
            whiteSpace: "nowrap",
          }}
        >
          <Box
            component="span"
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: chip.dot,
              flexShrink: 0,
              animation: "crqStatusPulse 1.8s ease-in-out infinite",
              "@keyframes crqStatusPulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.35 } },
            }}
          />
          {formatStatusLabel(info.currentStatus)}
        </Box>

        {remark && (
          <Tooltip title={remark} arrow>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.secondary",
                maxWidth: 260,
                minWidth: 0,
              }}
            >
              <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 14, flexShrink: 0 }} />
              <Typography
                sx={{ fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {remark}
              </Typography>
            </Box>
          </Tooltip>
        )}

        <Box
          sx={{
            ml: { xs: 0, sm: "auto" },
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            flexWrap: "wrap",
          }}
        >
          {progress && progress.total > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary", whiteSpace: "nowrap" }}>
                {progress.completed}/{progress.total} stages
              </Typography>
              <Box
                sx={{
                  width: { xs: 70, md: 96 },
                  height: 6,
                  borderRadius: "999px",
                  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(13,27,42,0.08)",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    borderRadius: "999px",
                    width: `${progress.pct}%`,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                    transition: "width 0.6s ease-out",
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary" }}>
                {progress.pct}%
              </Typography>
            </Box>
          )}

          {/* CRQ-level assignment (sp_get_SPOC_FE_details) - distinct from the
              per-service SPOC rows in the roster panel below, which come from
              the journey proc and carry no Field Engineer. */}
          {onViewSpocFe && (
            <Tooltip title="View the SPOC and Field Engineer assigned to this CRQ" arrow>
              <Button
                size="small"
                variant="outlined"
                onClick={onViewSpocFe}
                startIcon={<EngineeringOutlinedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  height: 26,
                  px: 1.1,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: "999px",
                  whiteSpace: "nowrap",
                  color: "text.secondary",
                  borderColor: "divider",
                  background: theme.palette.background.paper,
                  "& .MuiButton-startIcon": { mr: 0.5 },
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    background: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06),
                  },
                }}
              >
                SPOC &amp; Field Engineer
              </Button>
            </Tooltip>
          )}

          {onRefresh && (
            <Tooltip title="Refresh journey" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  sx={{ color: "text.secondary" }}
                >
                  {isRefreshing ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <RefreshRoundedIcon sx={{ fontSize: 17 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── meta grid ── */}
      <Box
        sx={{
          px: { xs: 1.5, md: 2 },
          py: 1,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
          },
          gap: { xs: 1.25, md: 1.5 },
        }}
      >
        {/* These two are absent from the search row when the CRQ was typed in
            rather than browsed to, and only arrive with the details call — so
            they wait on the same skeleton as the details-only fields below. */}
        <MetaItem
          icon={TimelineRoundedIcon}
          label="Current Stage"
          loading={isLoadingDetails && !info.currentStage}
        >
          <Truncated value={info.currentStage || "—"} />
        </MetaItem>

        <MetaItem
          icon={AccessTimeRoundedIcon}
          label="Entered Stage At"
          loading={isLoadingDetails && !info.enteredCurrentStageAt}
        >
          <Truncated value={formatDateTime(info.enteredCurrentStageAt)} />
        </MetaItem>

        <MetaItem icon={BusinessCenterRoundedIcon} label="Team Function" loading={isLoadingDetails && !details}>
          <Truncated value={details?.teamFunction ?? "—"} />
        </MetaItem>

        <MetaItem icon={AccountTreeRoundedIcon} label="Sub-Function" loading={isLoadingDetails && !details}>
          <Truncated value={details?.teamSubFunction ?? "—"} />
        </MetaItem>

        <MetaItem icon={CalendarMonthRoundedIcon} label="Created On" loading={isLoadingDetails && !details}>
          <Truncated value={formatDateTime(details?.createdDate)} />
        </MetaItem>
      </Box>
    </Box>
  );
};
