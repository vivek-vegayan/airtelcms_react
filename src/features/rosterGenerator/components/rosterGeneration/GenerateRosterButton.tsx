import { memo } from "react";
import { alpha, Box, Button, CircularProgress } from "@mui/material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import type {
  RosterAccent,
  TabColorTokens,
} from "../../types/rosterGenerationMain.types";
import { resolveAccent } from "./rosterTabsConfig";

interface GenerateRosterButtonProps {
  isGenerating: boolean;
  onGenerate: () => void;
  tk: TabColorTokens;
  accent: RosterAccent;
}

function GenerateRosterButton({
  isGenerating,
  onGenerate,
  tk,
  accent,
}: GenerateRosterButtonProps) {
  const { main: glowColor } = resolveAccent(tk, accent);

  return (
    <Button
      variant="contained"
      disabled={isGenerating}
      startIcon={
        isGenerating ? (
          <CircularProgress size={14} color="inherit" />
        ) : (
          <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
        )
      }
      onClick={onGenerate}
      sx={{
        position: "relative",
        overflow: "hidden",
        height: 32,
        minWidth: { xs: 0, sm: 150 },
        flexShrink: 0,
        whiteSpace: "nowrap",
        mb: 0.5,
        ml: 1,
        px: { xs: 1.5, sm: 2 },
        borderRadius: "10px",
        textTransform: "none",
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: "0.02em",

        background: `linear-gradient(135deg, ${tk.accent} 0%, ${tk.success} 100%)`,
        color: "#fff",

        boxShadow: `0 4px 14px ${alpha(glowColor, 0.28)}`,

        transition: "transform .22s ease, box-shadow .22s ease, filter .22s ease",

        "&:hover": {
          transform: "translateY(-1px)",
          filter: "brightness(1.05)",
          boxShadow: `0 8px 24px ${alpha(glowColor, 0.35)}`,
        },

        "&:active": {
          transform: "translateY(0px)",
        },

        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: "-120%",
          width: "80%",
          height: "100%",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent)",
          transition: "left .8s ease",
        },

        "&:hover::before": {
          left: "140%",
        },

        "&.Mui-disabled": {
          color: "#fff",
          opacity: 0.8,
        },
      }}
    >
      <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
        {isGenerating ? "Generating…" : "Generate Roster"}
      </Box>
      <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
        {isGenerating ? "Generating" : "Generate"}
      </Box>
    </Button>
  );
}

export default memo(GenerateRosterButton);
