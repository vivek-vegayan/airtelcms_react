import React from "react";
import { Box, Tooltip } from "@mui/material";
import type { MandatoryLevel } from "../types/attributeUpdate.types";
import { MANDATORY_BADGE } from "../constants/attributeUpdate.constants";

interface MandatoryBadgeProps {
  level: MandatoryLevel;
  /** Raw mandatory label, shown as tooltip for conditional fields. */
  rawLabel: string;
}

/**
 * Compact mandatory-level indicator: a small colored dot (red/amber/gray)
 * with the full label on hover. Replaces a text pill so field tiles stay
 * dense in the grid layout.
 */
export const MandatoryBadge: React.FC<MandatoryBadgeProps> = React.memo(function MandatoryBadge({
  level,
  rawLabel,
}) {
  const palette = MANDATORY_BADGE[level];
  const title = level === "conditional" ? rawLabel : palette.label;

  return (
    <Tooltip title={title} arrow placement="top">
      <Box
        component="span"
        sx={{
          width: 7,
          height: 7,
          flexShrink: 0,
          borderRadius: "50%",
          bgcolor: palette.dot,
          boxShadow: level === "mandatory" ? `0 0 0 2px ${palette.dot}22` : "none",
          cursor: "default",
        }}
      />
    </Tooltip>
  );
});

export default MandatoryBadge;
