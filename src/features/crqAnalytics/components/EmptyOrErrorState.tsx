import { Box, Typography } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";

interface Props {
  kind: "error" | "empty";
  message?: string;
}

/** Replaces the old app's silent fake-data fallback with a real, honest state (per migration decision). */
export function EmptyOrErrorState({ kind, message }: Props) {
  const isError = kind === "error";
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        height: "100%",
        minHeight: 160,
        color: isError ? "error.main" : "text.disabled",
        textAlign: "center",
        p: 2,
      }}
    >
      {isError ? <ErrorOutlineRoundedIcon sx={{ fontSize: 32 }} /> : <InboxRoundedIcon sx={{ fontSize: 32 }} />}
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
        {message ?? (isError ? "Couldn't load this data." : "No data for the selected filters.")}
      </Typography>
    </Box>
  );
}
