import React from "react";
import { Chip, Tooltip } from "@mui/material";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";

interface MyCrqsToggleProps {
  active: boolean;
  onToggle: () => void;
  olmId: string | null | undefined;
  colors: any;
}

/** Toolbar chip that narrows the stage listing to CRQs whose OLM id for this stage is the user's. */
const MyCrqsToggle: React.FC<MyCrqsToggleProps> = ({ active, onToggle, olmId, colors }) => (
  <Tooltip
    title={
      olmId
        ? `Show only CRQs assigned to you for this stage (${olmId})`
        : "Your OLM ID is not available"
    }
  >
    <span>
      <Chip
        icon={<PersonOutlineRoundedIcon sx={{ fontSize: 16 }} />}
        label="My CRQs"
        clickable
        disabled={!olmId}
        onClick={onToggle}
        aria-pressed={active}
        sx={{
          height: 34,
          borderRadius: "9px",
          fontSize: 12.5,
          fontWeight: 600,
          flexShrink: 0,
          bgcolor: active ? colors.accentDim : colors.trackOff,
          color: active ? colors.accent : colors.textSecondary,
          border: `1px solid ${active ? colors.accent : colors.border}`,
          "& .MuiChip-icon": { color: "inherit" },
          "&:hover": { bgcolor: colors.accentDim, color: colors.accent },
        }}
      />
    </span>
  </Tooltip>
);

export default MyCrqsToggle;
