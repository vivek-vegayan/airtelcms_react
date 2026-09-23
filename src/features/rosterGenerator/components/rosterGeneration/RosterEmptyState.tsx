import { memo } from "react";
import { Box, Typography } from "@mui/material";
import NoDataFound from "../../../../assets/svg/Filter.svg";

interface RosterEmptyStateProps {
  textColor: string;
  message?: string;
}

function RosterEmptyState({
  textColor,
  message = "Select a sub domain to view or generate a roster",
}: RosterEmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 2,
        px: 2,
        textAlign: "center",
      }}
    >
      <Box
        component="img"
        src={NoDataFound}
        alt="No data"
        sx={{ width: "auto", maxWidth: "100%", height: "auto", opacity: 0.9 }}
      />
      <Typography
        sx={{
          fontSize: 13,
          color: textColor,
          fontWeight: 500,
          textAlign: "center",
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}

export default memo(RosterEmptyState);
