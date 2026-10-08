import { useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";

import CommonContainer from "../../../components/common/CommonContainer";
import { useTabColorTokens } from "../../../style/theme";
import ActivityAvailabilityView from "./ActivityAvailabilityView";
import AllPlansView from "./AllPlansView";
import TeamCapacityView from "./TeamCapacityView";

type SlotVisibilityTab = "capacity" | "activity" | "plans";

const VIEWS: { value: SlotVisibilityTab; label: string; hint: string; icon: typeof GroupsRoundedIcon }[] = [
  { value: "capacity", label: "Team capacity", hint: "Free minutes per shift and date for a team", icon: GroupsRoundedIcon },
  { value: "activity", label: "Check an activity", hint: "Where a specific activity still fits", icon: EventAvailableRoundedIcon },
  { value: "plans", label: "All plans", hint: "14-day fit for every plan type", icon: ViewListRoundedIcon },
];

export default function SlotVisibilityPage() {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const [activeTab, setActiveTab] = useState<SlotVisibilityTab>("capacity");

  const activeView = VIEWS.find((v) => v.value === activeTab);

  return (
    <CommonContainer>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            exclusive
            value={activeTab}
            onChange={(_e, v: SlotVisibilityTab | null) => v && setActiveTab(v)}
            sx={{ background: colors.surface, borderRadius: colors.radius }}
          >
            {VIEWS.map(({ value, label, icon: Icon }) => (
              <ToggleButton key={value} value={value} sx={{ textTransform: "none", px: 2, gap: 0.75, fontWeight: 600 }}>
                <Icon sx={{ fontSize: 18 }} />
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>{activeView?.hint}</Typography>
        </Box>

        {activeTab === "capacity" && <TeamCapacityView onCheckActivity={() => setActiveTab("activity")} />}
        {activeTab === "activity" && <ActivityAvailabilityView />}
        {activeTab === "plans" && <AllPlansView />}
      </Box>
    </CommonContainer>
  );
}
