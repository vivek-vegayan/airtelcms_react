import { Tabs, Tab, Box, useTheme, alpha } from "@mui/material";
import type { LeaveStats, LeaveTabValue } from "../types/leave.types";

interface TabDef {
  label: string;
  value: LeaveTabValue;
}

const TABS: TabDef[] = [
  { label: "All",      value: "ALL"      },
  { label: "Pending",  value: "PENDING"  },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const TAB_BADGE_COLORS: Record<LeaveTabValue, string> = {
  ALL:      "#3B82F6",
  PENDING:  "#F59E0B",
  APPROVED: "#10B981",
  REJECTED: "#EF4444",
};

interface LeaveTabsProps {
  value: LeaveTabValue;
  onChange: (value: LeaveTabValue) => void;
  /** Pass stats so each tab shows a live count badge */
  stats?: LeaveStats & { total?: number };
}

export const LeaveTabs = ({ value, onChange, stats }: LeaveTabsProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const countMap: Record<LeaveTabValue, number | undefined> = {
    ALL:      stats ? (stats.pendingCount + stats.approvedCount + stats.rejectedCount) : undefined,
    PENDING:  stats?.pendingCount,
    APPROVED: stats?.approvedCount,
    REJECTED: stats?.rejectedCount,
  };

  return (
    <Tabs
      value={value}
      onChange={(_, newValue: LeaveTabValue) => onChange(newValue)}
      TabIndicatorProps={{
        style: {
          height: 2.5,
          borderRadius: "2px 2px 0 0",
          backgroundColor: TAB_BADGE_COLORS[value],
        },
      }}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 42,
        "& .MuiTabs-root": { minHeight: 42 },
      }}
    >
      {TABS.map((tab) => {
        const isActive = value === tab.value;
        const accentColor = TAB_BADGE_COLORS[tab.value];
        const count = countMap[tab.value];

        return (
          <Tab
            key={tab.value}
            value={tab.value}
            disableRipple
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <span>{tab.label}</span>
                {count !== undefined && (
                  <Box
                    sx={{
                      minWidth: 18,
                      height: 18,
                      px: 0.6,
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      lineHeight: 1,
                      transition: "all 0.2s ease",
                      background: isActive
                        ? alpha(accentColor, isDark ? 0.2 : 0.12)
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "#EEF1F5",
                      color: isActive
                        ? accentColor
                        : isDark
                          ? "rgba(255,255,255,0.35)"
                          : "#94A3B8",
                    }}
                  >
                    {count}
                  </Box>
                )}
              </Box>
            }
            sx={{
              minHeight: 42,
              py: 0,
              px: 2,
              fontSize: "0.815rem",
              fontWeight: isActive ? 700 : 500,
              textTransform: "none",
              letterSpacing: "-0.01em",
              color: isActive
                ? accentColor
                : isDark
                  ? "rgba(255,255,255,0.45)"
                  : "#64748B",
              transition: "all 0.18s ease",
              "&:hover": {
                color: isActive
                  ? accentColor
                  : isDark
                    ? "rgba(255,255,255,0.7)"
                    : "#334155",
                background: isDark
                  ? "rgba(255,255,255,0.04)"
                  : alpha(accentColor, 0.04),
              },
              "&.Mui-selected": {
                color: accentColor,
              },
            }}
          />
        );
      })}
    </Tabs>
  );
};

// import { Tabs, Tab } from "@mui/material";
// import type { LeaveTabValue } from "../types/leave.types";

// interface Tab {
//   label: string;
//   value: LeaveTabValue;
// }

// const TABS: Tab[] = [
//   { label: "All", value: "ALL" },
//   { label: "Pending", value: "PENDING" },
//   { label: "Approved", value: "APPROVED" },
//   { label: "Rejected", value: "REJECTED" },
// ];

// interface LeaveTabsProps {
//   value: LeaveTabValue;
//   onChange: (value: LeaveTabValue) => void;
// }

// export const LeaveTabs = ({ value, onChange }: LeaveTabsProps) => (
//   <Tabs
//     value={value}
//     onChange={(_, newValue: LeaveTabValue) => onChange(newValue)}
//     indicatorColor="primary"
//     textColor="primary"
//     variant="scrollable"
//     scrollButtons="auto"
//   >
//     {TABS.map((tab) => (
//       <Tab key={tab.value} label={tab.label} value={tab.value} />
//     ))}
//   </Tabs>
// );