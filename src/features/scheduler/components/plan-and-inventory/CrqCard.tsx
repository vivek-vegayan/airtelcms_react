import {
  Paper,
  Stack,
  IconButton,
  Box,
  Checkbox,
  Chip,
  Button,
  Collapse,
  Typography,
} from "@mui/material";
import type { Colors } from "../../types/colorTypes";
import CrqInfoCards from "../generic/CrqInfoCards";
import CrqTaskTable from "../generic/CrqTaskTable";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import StopRoundedIcon from "@mui/icons-material/StopRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { format } from "date-fns";
import { StageHistoryPanel } from "../generic/StageHistoryPanel";
interface CrqCardProps {
  crq: any;
  plan: any;
  isOpen: boolean;
  isSelected: boolean;
  colors: Colors;
  onToggle: () => void;
  onSelect: () => void;
  onStartPause: () => void;
}

export const CrqCard: React.FC<CrqCardProps> = ({
  crq,
  isOpen,
  isSelected,
  colors,
  onToggle,
  onSelect,
  onStartPause,
}) => {
  const isFailed = ["canceled", "cancel", "Canceled"].includes(crq.crqStatus);
  // Plan & Inventory card - the review (VALIDATE) status drives Start/Pause.
  const status = crq.crqReviewStatus || crq.impactAnalysisStatus;
  const isRunning = status === "In Progress";

  const formatDate = (dateString?: string) =>
    dateString ? format(new Date(dateString), "dd-MMM-yyyy HH:mm") : "-";

  const infoItems = [
    { label: "CRQ No", value: crq.crqNo || "-" },
    { label: "Start Date", value: formatDate(crq.activityPlanStartDate) },
    { label: "End Date", value: formatDate(crq.activityPlanEndDate) },
    { label: "CRQ Status", value: crq.crqStatus || "-" },
    { label: "CRQ Review Status", value: crq.crqReviewStatus || "-" },
    { label: "Review Start", value: crq.reviewStartDate || "-" },
    { label: "Review End", value: crq.reviewEndDate || "-" },
    { label: "OLM ID Review", value: crq.olmidReview || "-" },
    { label: "Change Impact", value: crq.changeImpact || crq.remedyChangeImpact || "-" },
  ];

  return (
    <Paper
      elevation={0}
      className="crq-card"
      sx={{
        mb: 1.5,
        borderRadius: colors.radiusL,
        border: `1.5px solid ${isSelected ? colors.accentBorder : colors.border}`,
        bgcolor: isSelected ? colors.accentDim : colors.surface,
        // bgcolor:"red",
        overflow: "hidden",
        transition:
          "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
        "&:hover": {
          borderColor: isSelected ? colors.accent : colors.borderHover,
          boxShadow: colors.isDark
            ? "0 4px 22px rgba(0,0,0,0.32)"
            : "0 4px 22px rgba(99,102,241,0.10)",
        },
      }}
    >
      {/* ── Header Row ── */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          px: 1.5,
          py: 1.1,
          gap: 1.5,
          borderLeft: `3px solid ${isSelected ? colors.accent : "transparent"}`,
          transition: "border-color 0.18s ease",
          overflowX: "auto",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <IconButton
          size="small"
          onClick={onToggle}
          disableRipple={false}
          sx={{
            width: 28,
            height: 28,
            borderRadius: "7px",
            flexShrink: 0,
            bgcolor: isOpen ? colors.accentDim : colors.trackOff,
            color: isOpen ? colors.accent : colors.textSecondary,
            border: `1px solid ${isOpen ? colors.accentBorder : colors.border}`,
            "&:hover": {
              bgcolor: colors.accentDim,
              color: colors.accent,
              borderColor: colors.accentBorder,
            },
          }}
        >
          <Box className={`expand-chevron${isOpen ? " open" : ""}`}>
            <ChevronRightIcon sx={{ fontSize: 16 }} />
          </Box>
        </IconButton>

        <Checkbox
          checked={isSelected}
          onChange={onSelect}
          size="small"
          sx={{
            p: 0,
            flexShrink: 0,
            color: colors.border,
            "&.Mui-checked": { color: colors.accent },
          }}
        />

   

        {/* Info Cards Container */}
        <Box sx={{ flex: 1, overflowX: "scroll", width: "60vw" }}>
          <CrqInfoCards colors={colors} data={crq} items={infoItems} />
        </Box>

        {(crq.tasks?.length ?? 0) > 0 && (
          <Chip
            icon={<AssignmentOutlinedIcon style={{ fontSize: 12 }} />}
            label={crq.tasks.length}
            size="small"
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
              bgcolor: colors.infoDim,
              color: colors.info,
              border: `1px solid ${colors.infoBorder}`,
              "& .MuiChip-icon": { color: colors.info, ml: 0.7, mr: -0.4 },
              "& .MuiChip-label": { px: 0.8 },
            }}
          />
        )}

        <Button
          variant="outlined"
          size="small"
          disabled={isFailed}
          startIcon={
            isRunning ? (
              <StopRoundedIcon sx={{ fontSize: "14px !important" }} />
            ) : (
              <PlayArrowRoundedIcon sx={{ fontSize: "14px !important" }} />
            )
          }
          onClick={onStartPause}
          sx={{
            flexShrink: 0,
            height: 30,
            minWidth: 90,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.3,
            borderRadius: "8px",
            px: 1.5,
            transition: "all 0.15s ease",
            ...(isFailed
              ? {
                  bgcolor: colors.trackOff,
                  color: colors.textDim,
                  borderColor: colors.trackOffBorder,
                  "&.Mui-disabled": {
                    bgcolor: colors.trackOff,
                    color: colors.textDim,
                    borderColor: colors.trackOffBorder,
                  },
                }
              : isRunning
                ? {
                    bgcolor: colors.dangerDim,
                    color: colors.danger,
                    borderColor: colors.dangerBorder,
                    "&:hover": {
                      bgcolor: colors.danger,
                      color: "#fff",
                      borderColor: colors.danger,
                    },
                  }
                : {
                    bgcolor: colors.successDim,
                    color: colors.success,
                    borderColor: colors.successBorder,
                    "&:hover": {
                      bgcolor: colors.success,
                      color: "#fff",
                      borderColor: colors.success,
                    },
                  }),
          }}
        >
          {isFailed ? "Disabled" : isRunning ? "Pause" : "Start"}
        </Button>
      </Stack>

      {/* ── Tasks Collapse ── */}
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Box
          sx={{
            mx: 2,
            mb: 1.5,
            borderRadius: colors.radius,
            border: `1px solid ${colors.border}`,
            overflow: "hidden",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              px: 1.5,
              py: 0.85,
              bgcolor: colors.infoDim,
              borderBottom: `1px solid ${colors.infoBorder}`,
            }}
          >
            <AssignmentOutlinedIcon sx={{ fontSize: 13, color: colors.info }} />
            <Typography
              sx={{ fontSize: 12, fontWeight: 700, color: colors.info }}
            >
              Tasks
            </Typography>
            <Chip
              label={crq.tasks?.length ?? 0}
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: 800,
                bgcolor: `${colors.info}22`,
                color: colors.info,
                "& .MuiChip-label": { px: 0.7 },
              }}
            />
          </Stack>
          <Box sx={{ bgcolor: colors.surface }}>
            <CrqTaskTable tasks={crq.tasks} colors={colors} />
          </Box>
        </Box>

        {/* Read-only previous-stage history (populated once the CRQ has
            advanced past at least one stage; empty for fresh CRQs). */}
        {(crq.history?.length ?? 0) > 0 && (
          <Box sx={{ mx: 2, mb: 1.5 }}>
            <StageHistoryPanel history={crq.history} colors={colors} dense />
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};
