import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import { AdminAnalyticsTab } from "./admin/AnalyticsTab";
import { AdminAssignMatrixTab } from "./admin/AssignMatrixTab";
import { AdminReasonsTab } from "./admin/ReasonsTab";
import { AdminEscalationMatrixTab } from "./admin/EscalationMatrixTab";
import { AdminUsersTab } from "./admin/UsersTab";
import { AdminAuditTab } from "./admin/AuditTab";

const TABS = [
  // { id: "analytics",   label: "Analytics" },
  { id: "assign",      label: "Assignment Matrix" },
  { id: "reasons",     label: "Rejection Reasons" },
  // { id: "escalation",  label: "Escalation Matrix" },
  // { id: "users",       label: "Users & Roles" },
  // { id: "audit",       label: "Audit Log" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminPage() {
  const [tab, setTab] = useState<TabId>("assign");

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as TabId)}
        sx={{
          mb: 1.5,
          minHeight: 40,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { minHeight: 40, py: 1 },
        }}
      >
        {TABS.map((t) => <Tab key={t.id} label={t.label} value={t.id} />)}
      </Tabs>

      {/* {tab === "analytics"  && <AdminAnalyticsTab />} */}
      {tab === "assign"     && <AdminAssignMatrixTab />}
      {tab === "reasons"    && <AdminReasonsTab />}
      {/* {tab === "escalation" && <AdminEscalationMatrixTab />} */}
      {/* {tab === "users"      && <AdminUsersTab />} */}
      {/* {tab === "audit"      && <AdminAuditTab />} */}
    </Box>
  );
}
