import { Box } from "@mui/material";
import {
  Group,
  Shield,
  SupervisorAccount,
  PersonOff,
  PersonAdd,
  Verified,
} from "@mui/icons-material";
import dayjs from "dayjs";
import StatCard from "./StatCard";
import type { UserStats } from "../api/userManagementApi";

// Stats are unfiltered aggregates across all users, returned alongside the
// filtered/paginated grid by the same sp_get_users_paginated call — not
// derived from the (search/filter/page-limited) rows currently on screen.
//
// Everything shown here is a real figure from that call. The cards used to
// carry a "trend" percentage and a sparkline generated from a seeded PRNG:
// invented movement, indistinguishable from measured movement, on a screen
// people use to make access decisions. Both are gone; the only comparison
// left is each metric's share of the directory, which is arithmetic on the
// numbers actually returned.
export default function StatsSection({
  stats,
  dense = false,
}: {
  stats?: UserStats;
  /** Short-viewport mode: one tighter, non-wrapping (horizontally scrollable)
   *  row instead of a block that can wrap to two or three rows and eat the
   *  height the table needs. */
  dense?: boolean;
}) {
  const s = stats ?? {
    activeCount: 0,
    inactiveCount: 0,
    adminCount: 0,
    headCount: 0,
    newThisMonth: 0,
  };
  const total = s.activeCount + s.inactiveCount;
  const shareOf = (n: number) => (total > 0 ? n / total : 0);
  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}% of directory` : "—");

  const cards = [
    {
      label: "Total Users",
      value: total,
      icon: Group,
      color: "#2563EB",
      caption: `${s.activeCount.toLocaleString()} active · ${s.inactiveCount.toLocaleString()} inactive`,
    },
    {
      label: "Active",
      value: s.activeCount,
      icon: Verified,
      color: "#059669",
      share: shareOf(s.activeCount),
      caption: pct(s.activeCount),
    },
    {
      label: "Team Heads",
      value: s.headCount,
      icon: SupervisorAccount,
      color: "#7C3AED",
      share: shareOf(s.headCount),
      caption: pct(s.headCount),
    },
    {
      label: "Super Admins",
      value: s.adminCount,
      icon: Shield,
      color: "#DC2626",
      share: shareOf(s.adminCount),
      caption: pct(s.adminCount),
    },
    {
      label: "Inactive",
      value: s.inactiveCount,
      icon: PersonOff,
      color: "#D97706",
      share: shareOf(s.inactiveCount),
      caption: pct(s.inactiveCount),
    },
    {
      label: "New This Month",
      value: s.newThisMonth,
      icon: PersonAdd,
      color: "#0891B2",
      share: shareOf(s.newThisMonth),
      caption: `Joined since ${dayjs().startOf("month").format("D MMM")}`,
    },
  ];

  return (
    <Box
      sx={{
        gap: 1,
        mb: dense ? 1 : 1.5,
        flexShrink: 0,
        ...(dense
          ? {
              display: "flex",
              flexDirection: "row",
              flexWrap: "nowrap",
              overflowX: "auto",
              pb: 0.5,
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": { height: 5 },
            }
          : {
              // A grid with a fixed column count per breakpoint rather than
              // wrapped flex: six cards flowing freely left two orphans
              // stretched across the full width on a tablet, which read as a
              // different, more important kind of card.
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(6, minmax(0, 1fr))",
              },
            }),
      }}
    >
      {cards.map((c) => (
        <StatCard
          key={c.label}
          label={c.label}
          value={c.value}
          icon={c.icon}
          color={c.color}
          share={c.share}
          caption={c.caption}
          dense={dense}
        />
      ))}
    </Box>
  );
}
