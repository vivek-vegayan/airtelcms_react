import { Stack, Switch, Typography, useTheme } from "@mui/material";

interface Props {
  checked: boolean;
  onToggle: () => void;
}

/** Compact ⇄ detailed density switch shared by both roster toolbars. */
export const DetailedViewToggle = ({ checked, onToggle }: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      bgcolor={isDark ? theme.palette.background.paper : "#F3F4F6"}
      borderRadius={6}
      px={1.5}
      py={0.5}
      border={`0.5px solid ${theme.palette.divider}`}
    >
      <Switch
        checked={checked}
        onChange={onToggle}
        size="small"
        color="primary"
        sx={{
          "& .MuiSwitch-thumb": { width: 14, height: 14 },
          "& .MuiSwitch-track": { borderRadius: 8 },
        }}
      />
      <Typography
        sx={{
          fontSize: "0.8rem",
          fontWeight: 500,
          color: checked ? "primary.main" : "text.secondary",
          userSelect: "none",
        }}
      >
        Detailed
      </Typography>
    </Stack>
  );
};
