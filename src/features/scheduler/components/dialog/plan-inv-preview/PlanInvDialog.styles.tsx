import { Box, Typography, styled, alpha } from "@mui/material";

export const StatusCard = styled(Box, {
  shouldForwardProp: (p) => !["selected", "accent", "isDisabled"].includes(p as string),
})<{ selected?: boolean; accent?: string; isDisabled?: boolean }>(
  ({ theme, selected, accent, isDisabled }) => ({
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1.1),
    padding: theme.spacing(1.1, 1.5),
    borderRadius: 10,
    border: "1.5px solid",
    borderColor: selected ? accent : theme.palette.divider,
    backgroundColor: selected ? alpha(accent!, 0.06) : theme.palette.background.paper,
    color: selected ? accent : theme.palette.text.secondary,
    cursor: isDisabled ? "not-allowed" : "pointer",
    userSelect: "none",
    opacity: isDisabled ? 0.5 : 1,
    overflow: "hidden",
    transition: "all 180ms cubic-bezier(0.4,0,0.2,1)",

    "&::before": {
      content: '""',
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderRadius: "12px 0 0 12px",
      backgroundColor: accent,
      transform: selected ? "scaleY(1)" : "scaleY(0)",
      transition: "transform 200ms cubic-bezier(0.4,0,0.2,1)",
    },

    ...(!isDisabled && {
      "&:hover": {
        borderColor: accent,
        backgroundColor: alpha(accent!, 0.05),
        color: accent,
        transform: "translateY(-1px)",
        boxShadow: `0 4px 12px ${alpha(accent!, 0.12)}`,
      },
    }),
    ...(selected && { boxShadow: `0 2px 10px ${alpha(accent!, 0.15)}` }),
  }),
);

export const TeamButton = styled(Box, {
  shouldForwardProp: (p) => !["selected", "accent"].includes(p as string),
})<{ selected?: boolean; accent?: string }>(({ theme, selected, accent }) => ({
  flex: 1,
  textAlign: "center",
  padding: theme.spacing(0.875, 0.5),
  borderRadius: 8,
  border: "1.5px solid",
  borderColor: selected ? accent : theme.palette.divider,
  backgroundColor: selected ? accent : "transparent",
  color: selected ? "#fff" : theme.palette.text.secondary,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: selected ? 600 : 400,
  transition: "all 160ms ease",
  "&:hover": {
    borderColor: accent,
    color: selected ? "#fff" : accent,
    backgroundColor: selected ? accent : alpha(accent!, 0.07),
  },
}));

export const SectionLabel = styled(Typography)(({ theme }) => ({
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: theme.palette.text.disabled,
}));