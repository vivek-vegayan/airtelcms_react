import { Box, Typography, alpha, lighten, useTheme } from "@mui/material";
import { getRoleConfig } from "../types/user";

/**
 * Role pill.
 *
 * Tonal (tinted background, coloured text) rather than the previous saturated
 * gradient with a drop shadow: a directory row can carry a role badge, a status
 * badge and a department chip at once, and three glowing gradient pills per row
 * read as decoration competing with the data. The hue still identifies the role
 * family — it just sits behind the text instead of shouting over it.
 */
export default function RoleBadge({
  role,
  size = "medium",
}: {
  role: string | null | undefined;
  size?: "small" | "medium";
}) {
  const { label, color, icon: Icon } = getRoleConfig(role);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const compact = size === "small";

  // The stored hue is picked for a white background. On the dark theme it has
  // to be lifted well clear of the surface, not just made translucent —
  // alpha() over a dark ground darkens text instead of brightening it.
  const ink = isDark ? lighten(color, 0.45) : color;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: compact ? 0.9 : 1.15,
        py: compact ? 0.3 : 0.45,
        borderRadius: 999,
        maxWidth: "100%",
        bgcolor: alpha(color, isDark ? 0.2 : 0.1),
        border: "1px solid",
        borderColor: alpha(color, isDark ? 0.34 : 0.2),
      }}
    >
      <Icon
        sx={{
          fontSize: compact ? 12 : 14,
          color: ink,
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontSize: compact ? 10.5 : 11.5,
          fontWeight: 700,
          color: ink,
          lineHeight: 1.3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
