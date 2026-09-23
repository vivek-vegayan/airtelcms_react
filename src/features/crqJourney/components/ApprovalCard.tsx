import React from "react";
import { Box, Tooltip, Typography, useTheme, alpha } from "@mui/material";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import TvRoundedIcon from "@mui/icons-material/TvRounded";
import CableRoundedIcon from "@mui/icons-material/CableRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import CellTowerRoundedIcon from "@mui/icons-material/CellTowerRounded";
import SettingsInputAntennaRoundedIcon from "@mui/icons-material/SettingsInputAntennaRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import type { ApprovalIconKey, CrqJourneyStageRow, PendingApprovalView } from "../types/crqJourney.types";
import {
  getApprovalStatusConfig,
  approverLabel,
  formatApprovalName,
  formatStatusLabel,
  normalizeApprovalStatus,
  pickApprovalIcon,
} from "../utils/crqJourney.utils";

const ICON_MAP: Record<ApprovalIconKey, React.ElementType> = {
  mobility:     WifiRoundedIcon,
  b2b:          BusinessRoundedIcon,
  telemedia:    TvRoundedIcon,
  optical:      CableRoundedIcon,
  packet:       SpeedRoundedIcon,
  security:     SecurityRoundedIcon,
  ran:          CellTowerRoundedIcon,
  transmission: SettingsInputAntennaRoundedIcon,
  core:         HubRoundedIcon,
  user:         PersonRoundedIcon,
  others:       MoreHorizRoundedIcon,
};

const BADGE_ICON = {
  approved: CheckRoundedIcon,
  rejected: CloseRoundedIcon,
  pending:  AccessTimeRoundedIcon,
} as const;

interface ApprovalCardProps {
  approval: CrqJourneyStageRow;
  /**
   * The approver who owes a decision on this service, when it's still pending
   * (result set 2 of sp_get_crq_journey_page). The card has no room to print a
   * person's name, so it lands in the tooltip — the sortable, copyable,
   * contactable version, alongside the service's SPOC, is the ServiceRosterPanel.
   */
  approver?: PendingApprovalView | null;
  /** Canvas-driven width — the approvals lane divides its space between however many services the CRQ has. */
  width?: number | string;
  height?: number | string;
}

/** One service approval linked to the CRQ (CRQ_CAB_SERVICE_TBL) — count varies per CRQ. */
export const ApprovalCard: React.FC<ApprovalCardProps> = ({ approval, approver, width, height }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const status = normalizeApprovalStatus(approval.status);
  const cfg = getApprovalStatusConfig(isDark)[status];
  const Icon = ICON_MAP[pickApprovalIcon(approval.stage)];
  const BadgeIcon = BADGE_ICON[status];
  const showPulse = status !== "approved";
  // Shortened for the card, full service name preserved in the tooltip.
  const displayName = formatApprovalName(approval.stage);

  // Only a pending row has an approver still to act; an approved/rejected card
  // showing "Awaiting X" would contradict its own badge. The lookup is keyed by
  // service, so a CRQ with the same service both approved and pending resolves
  // the same row for both cards — hence the status guard rather than a
  // presence check alone.
  const pendingApprover = status === "pending" && approver ? approver : null;
  // Names the LIVE rung of the escalation ladder, which is not always L1 — the
  // whole point of an escalation is that the original approver stopped being the
  // answer, and sending a reader back to them wastes the escalation.
  const approverLine = pendingApprover
    ? pendingApprover.configured
      ? `Awaiting ${approverLabel(pendingApprover)}${
          pendingApprover.approverOlmId ? ` (${pendingApprover.approverOlmId})` : ""
        }${pendingApprover.escalated ? ` — escalated to ${pendingApprover.currentLevel}` : ""}`
      : pendingApprover.escalated
        ? `Escalated to ${pendingApprover.currentLevel} — nobody configured`
        : "No approver configured"
    : null;

  return (
    <Tooltip
      title={
        <>
          {approval.stage} — {formatStatusLabel(approval.status)}
          {approverLine && (
            <>
              <br />
              {approverLine}
            </>
          )}
        </>
      }
      arrow
      enterDelay={400}
    >
      <Box
        sx={{
          width: width ?? 92,
          height: height ?? "auto",
          flexShrink: 0,
          background: theme.palette.background.paper,
          border: `1.2px solid ${cfg.borderColor}`,
          borderRadius: "11px",
          py: 1,
          px: 0.75,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // The lane divides a fixed width between however many approvals the
          // CRQ has, so cards get narrow (~67px at four across) — nothing here
          // may spill out of that box.
          overflow: "hidden",
          boxShadow: isDark ? "0 2px 7px rgba(0,0,0,0.35)" : "0 2px 7px rgba(16,40,70,0.07)",
          position: "relative",
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            borderColor: alpha(cfg.color, 0.8),
            boxShadow: isDark ? "0 8px 20px rgba(0,0,0,0.5)" : "0 8px 20px rgba(16,40,70,0.13)",
          },
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "9px",
            background: cfg.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: cfg.color,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 16 }} />
        </Box>

        <Typography
          sx={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "text.primary",
            mt: 0.75,
            width: "100%",
            px: "2px",
            textAlign: "center",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {displayName}
        </Typography>

        <Typography
          sx={{
            fontSize: 10.5,
            color: cfg.color,
            fontWeight: 600,
            mt: "auto",
            pt: 0.5,
            width: "100%",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {formatStatusLabel(approval.status)}
        </Typography>

        <Box sx={{ position: "relative", mt: 0.5, width: 20, height: 20, flexShrink: 0 }}>
          {showPulse && (
            <Box
              component="span"
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: cfg.color,
                animation: "crqRipple 1.8s ease-out infinite",
                "@keyframes crqRipple": {
                  "0%": { transform: "scale(1)", opacity: 0.5 },
                  "70%, 100%": { transform: "scale(2.8)", opacity: 0 },
                },
              }}
            />
          )}
          <Box
            sx={{
              position: "relative",
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: cfg.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BadgeIcon sx={{ fontSize: 13, color: "#fff" }} />
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
};
