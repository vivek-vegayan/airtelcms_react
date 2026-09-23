import { memo } from "react";
import { Box, Typography } from "@mui/material";
import type {
  RosterTabConfig,
  TabColorTokens,
} from "../../types/rosterGenerationMain.types";
import { resolveAccent } from "./rosterTabsConfig";

interface RosterTabPillProps {
  tab: RosterTabConfig;
  index: number;
  isActive: boolean;
  tk: TabColorTokens;
  onSelect: (index: number) => void;
}

function RosterTabPill({
  tab,
  index,
  isActive,
  tk,
  onSelect,
}: RosterTabPillProps) {
  const { main: accentColor, dim: accentDim } = resolveAccent(tk, tab.accent);

  return (
    <Box
      onClick={() => onSelect(index)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.9,
        cursor: "pointer",
        borderRadius: "8px 8px 0 0",
        borderBottom: isActive
          ? `2px solid ${accentColor}`
          : "2px solid transparent",
        bgcolor: isActive ? tk.surface : "transparent",
        transition: "all .15s",
        "&:hover": {
          bgcolor: isActive ? tk.surface : accentDim,
        },
        mb: isActive ? "-1px" : 0,
        zIndex: isActive ? 1 : 0,
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Dot indicator */}
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          bgcolor: isActive ? accentColor : tk.textDim,
          transition: "background .15s",
          flexShrink: 0,
        }}
      />

      {/* Icon */}
      <Box
        sx={{
          color: isActive ? accentColor : tk.textSecondary,
          display: "flex",
          alignItems: "center",
          transition: "color .15s",
        }}
      >
        {tab.icon}
      </Box>

      {/* Label */}
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? accentColor : tk.textSecondary,
          lineHeight: 1,
          whiteSpace: "nowrap",
          transition: "all .15s",
          letterSpacing: isActive ? "0.01em" : 0,
        }}
      >
        {tab.label}
      </Typography>

      {/* Active underline pill */}
      {isActive && (
        <Box
          sx={{
            position: "absolute",
            bottom: -1,
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: 2,
            borderRadius: "2px 2px 0 0",
            bgcolor: accentColor,
            opacity: 0.35,
          }}
        />
      )}
    </Box>
  );
}

export default memo(RosterTabPill);
