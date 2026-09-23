import { Box, Stack, Tooltip } from "@mui/material";
import { SHIFT_CODES, SHIFT_META } from "./goldenGrid.constants";
import ShiftPill from "./ShiftPill";

export default function ShiftLegend() {
  return (
    <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
      {SHIFT_CODES.map((code) => (
        <Tooltip key={code} title={SHIFT_META[code]?.label ?? code} arrow>
          <Box>
            <ShiftPill code={code} />
          </Box>
        </Tooltip>
      ))}
    </Stack>
  );
}
