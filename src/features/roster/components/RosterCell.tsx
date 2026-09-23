import { Box, Stack, Typography, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditIcon from "@mui/icons-material/Edit";
import { shiftColorMap } from "../constant/shiftColors";
import type { Shift } from "../types/roster.types";

interface Props {
  shift?: Shift;
}

export const RosterCell = ({ shift }: Props) => {
  if (!shift || shift.shiftDisplay === "WO") {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#FAFAFA",
          borderRadius: 1,
        }}
      >
        <Typography fontSize="0.65rem">WO</Typography>
      </Box>
    );
  }

  const shiftKey = shift.shiftDisplay.charAt(0);

  const style =
    shiftColorMap.get(shiftKey) ?? {
      background: "#F8FAFC",
      color: "#475569",
      border: "#E2E8F0",
    };

  return (
    <Box
      sx={{
        bgcolor: style.background,
        borderLeft: `3px solid ${style.border}`,
        color: style.color,
        borderRadius: 1,
        px: 0.5,
        py: 0.25,
        height: "100%",
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Tooltip title="Shift Info">
          <InfoOutlinedIcon sx={{ fontSize: 13 }} />
        </Tooltip>

        <Typography fontSize="0.6rem" fontWeight={700}>
          {shift.shiftDisplay}
        </Typography>

        <Tooltip title="Edit">
          <EditIcon sx={{ fontSize: 13 }} />
        </Tooltip>
      </Stack>

      <Stack direction="row" justifyContent="space-between">
        <Typography fontSize="0.55rem">
          {shift.availableMins}m
        </Typography>

        <Typography fontSize="0.65rem" fontWeight={700}>
          {shift.assignActCount}
        </Typography>
      </Stack>
    </Box>
  );
};