import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface Props {
  label: string;
  labelMinWidth: number;
  onPrev: () => void;
  onNext: () => void;
}

/** Prev / label / next date range navigator for the roster page header. */
export const RosterDateNavigator = ({
  label,
  labelMinWidth,
  onPrev,
  onNext,
}: Props) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1,
      overflow: "hidden",
    }}
  >
    <IconButton size="small" onClick={onPrev} sx={{ borderRadius: 0, px: 0.5 }}>
      <ChevronLeftIcon fontSize="small" />
    </IconButton>

    <Typography
      sx={{
        fontSize: "0.8rem",
        fontWeight: 600,
        px: 1.5,
        minWidth: labelMinWidth,
        textAlign: "center",
        userSelect: "none",
      }}
    >
      {label}
    </Typography>

    <IconButton size="small" onClick={onNext} sx={{ borderRadius: 0, px: 0.5 }}>
      <ChevronRightIcon fontSize="small" />
    </IconButton>
  </Box>
);
