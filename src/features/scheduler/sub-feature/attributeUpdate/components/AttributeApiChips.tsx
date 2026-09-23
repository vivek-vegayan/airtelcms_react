import React from "react";
import { Stack, Tooltip, Typography } from "@mui/material";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import type { Colors } from "../../../types/colorTypes";
import {
  SYSTEM_ACCENT,
  SYSTEM_SECTIONS,
  SYSTEM_SECTION_ORDER,
} from "../constants/attributeUpdate.constants";

interface AttributeApiChipsProps {
  colors: Colors;
}

/** Slim "synced on save" caption naming the downstream systems this stage writes to. */
export const AttributeApiChips: React.FC<AttributeApiChipsProps> = React.memo(
  function AttributeApiChips({ colors }) {
    return (
  <Stack
    direction="row"
    alignItems="center"
    flexWrap="wrap"
    gap={0.75}
    sx={{ mb: 1.5, px: 0.25 }}
  >
    <SyncRoundedIcon sx={{ fontSize: 13, color: colors.textSecondary }} />
    <Typography sx={{ fontSize: 11.5, color: colors.textSecondary }}>
      Saves to:
    </Typography>
    {SYSTEM_SECTION_ORDER.map((system, index) => (
      <React.Fragment key={system}>
        <Tooltip title={SYSTEM_SECTIONS[system].apiChipLabel} arrow>
          <Typography
            component="span"
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: SYSTEM_ACCENT[system],
              cursor: "default",
            }}
          >
            {SYSTEM_SECTIONS[system].title.split(" ")[0]}
          </Typography>
        </Tooltip>
        {index < SYSTEM_SECTION_ORDER.length - 1 && (
          <Typography component="span" sx={{ fontSize: 11.5, color: colors.textDim }}>
            ·
          </Typography>
        )}
      </React.Fragment>
    ))}
  </Stack>
    );
  },
);

export default AttributeApiChips;
