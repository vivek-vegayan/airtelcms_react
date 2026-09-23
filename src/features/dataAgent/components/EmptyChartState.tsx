import { Box, Typography } from "@mui/material";

export default function EmptyChartState() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 160,
        color: "text.secondary",
      }}
    >
      <Typography variant="caption">No data</Typography>
    </Box>
  );
}
