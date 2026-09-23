import React from "react";
import { Box, Card, Typography, Grid, useTheme, alpha } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import type { TeamDataEntryType } from "../../types/TeamDataEntryType";

interface TeamTopInfoCardProps {
  levelCount: TeamDataEntryType[];
}

const LevelBadge = ({
  label,
  value,
  bg,
  iconColor,
  color,
  highlight,
}: {
  label: string;
  value: number;
  bg: string;
  iconColor: string;
  color: string;
  highlight?: boolean;
}) => (
  <Box
    sx={{
      minWidth: 100,
      px: 5,
      py: 1.5,
      borderRadius: 2,
      bgcolor: bg,
      color,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      boxShadow: highlight ? 6 : 1,
      transition: "all 0.25s ease",
      cursor: "pointer",
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: highlight ? 10 : 2,
      },
    }}
  >
    <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5, color: "inherit" }}>
      {label}
    </Typography>

    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <PersonIcon fontSize="small" sx={{ color: iconColor }} />
      <Typography variant="h6" fontWeight="bold" sx={{ color: "inherit" }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

export const TeamTopInfoCard: React.FC<TeamTopInfoCardProps> = ({
  levelCount,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Fixed-hue badges (independent of the selectable brand color) with
  // dark-mode variants — the previous version used light-mode-only pastel
  // backgrounds combined with an inherited (near-white in dark mode) text
  // color, which made the label/count fully unreadable in dark mode.
  // Light-mode text colors are darkened from the raw palette hue until they
  // clear 4.5:1 against their own tint background (the raw hues read fine
  // as icon accents but fail WCAG AA once used as caption/value text).
  const levelStyles = {
    L1: { bg: isDark ? alpha(theme.palette.info.main, 0.16) : "#E3F2FD", color: isDark ? theme.palette.info.light : "#176DC1" },
    L2: { bg: isDark ? alpha(theme.palette.success.main, 0.16) : "#E8F5E9", color: isDark ? theme.palette.success.light : "#2E7D32" },
    L3: { bg: isDark ? alpha(theme.palette.warning.main, 0.16) : "#FFF3E0", color: isDark ? theme.palette.warning.light : "#B65200" },
    L4: { bg: isDark ? alpha(theme.palette.error.main, 0.16) : "#FBE9E7", color: isDark ? theme.palette.error.light : "#C23C13" },
  } as const;
  const totalBg = isDark ? theme.palette.primary.dark : "#1E3A8A";
  const totalColor = theme.palette.getContrastText(totalBg);

  const activeMembers = levelCount.filter(
    (item) => item.status?.toLowerCase() === "active"
  );

  const levelCounts = activeMembers.reduce((acc, item) => {
    acc[item.level] = (acc[item.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalActive = activeMembers.length;

  return (
    <Card
      sx={{
        p: 0.5,
        m: 0.5,
        borderRadius: 3,
        boxShadow: 1,
      }}
    >
      <Grid container alignItems="center" spacing={2}>
        {/* Left: Team Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              width: "85%",
              p: 1,
              borderRadius: 1,

              /* Glass effect */
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",

              /* Glass border */
              border: "1px solid rgba(255, 255, 255, 0.3)",

              /* Depth */
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.12)",

              /* Interaction */
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
              },
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ letterSpacing: 0.5 }}
            >
              IP Core
            </Typography>

            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Team Head • Pankaj Chaudhary
            </Typography>
          </Card>
        </Grid>
     


        {/* Right: Level Stats */}
        <Grid
          // item xs={12} md={8}
          size={{ xs: 12, md: 8 }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              justifyContent: { xs: "flex-start", md: "flex-end" },
              flexWrap: "wrap",
            }}
          >
            <LevelBadge
              label="L1"
              value={levelCounts["L1"] || 0}
              bg={levelStyles.L1.bg}
              iconColor={levelStyles.L1.color}
              color={levelStyles.L1.color}
            />
            <LevelBadge
              label="L2"
              value={levelCounts["L2"] || 0}
              bg={levelStyles.L2.bg}
              iconColor={levelStyles.L2.color}
              color={levelStyles.L2.color}
            />
            <LevelBadge
              label="L3"
              value={levelCounts["L3"] || 0}
              bg={levelStyles.L3.bg}
              iconColor={levelStyles.L3.color}
              color={levelStyles.L3.color}
            />
            <LevelBadge
              label="L4"
              value={levelCounts["L4"] || 0}
              bg={levelStyles.L4.bg}
              iconColor={levelStyles.L4.color}
              color={levelStyles.L4.color}
            />
            <LevelBadge
              label="Total (Active) "
              value={totalActive}
              bg={totalBg}
              iconColor={totalColor}
              color={totalColor}
            />
    
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};
