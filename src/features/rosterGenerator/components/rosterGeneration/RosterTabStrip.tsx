import { memo, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type {
  RosterTabConfig,
  TabColorTokens,
} from "../../types/rosterGenerationMain.types";
import RosterTabPill from "./RosterTabPill";

interface RosterTabStripProps {
  tabs: RosterTabConfig[];
  activeIndex: number;
  onChange: (index: number) => void;
  tk: TabColorTokens;
  metaLabel: string;
  metaColor: string;
  children?: ReactNode;
}

function RosterTabStrip({
  tabs,
  activeIndex,
  onChange,
  tk,
  metaLabel,
  metaColor,
  children,
}: RosterTabStripProps) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: "flex",
        alignItems: "stretch",
        borderBottom: `1px solid ${tk.border}`,
        bgcolor: tk.isDark ? "rgba(255,255,255,0.02)" : "rgba(13,27,42,0.015)",
        px: 1,
        pt: 0.5,
        gap: 0.5,
      }}
    >
      {/* Tabs — scrolls horizontally on narrow viewports instead of clipping */}
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {tabs.map((tab, index) => (
          <RosterTabPill
            key={tab.id}
            tab={tab}
            index={index}
            isActive={activeIndex === index}
            tk={tk}
            onSelect={onChange}
          />
        ))}
      </Box>

      <Box sx={{ flex: 1, minWidth: 8 }} />

      {/* Right-side meta info — hidden on narrow viewports to keep the strip usable */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          gap: 1,
          pr: 0.5,
          pb: 0.5,
        }}
      >
        <Typography
          sx={{
            fontSize: 10,
            color: tk.textDim,
            fontWeight: 500,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {metaLabel}
        </Typography>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: metaColor,
            opacity: 0.6,
            flexShrink: 0,
          }}
        />
      </Box>

      {children}
    </Box>
  );
}

export default memo(RosterTabStrip);
