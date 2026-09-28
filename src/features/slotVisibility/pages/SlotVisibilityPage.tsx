import { useState } from "react";
import {
  Box,
  Tab,
  Tabs,
} from "@mui/material";

import CommonContainer from "../../../components/common/CommonContainer";
import ActivityAvailabilityView from "./ActivityAvailabilityView";
import AllPlansView from "./AllPlansView";
import TeamCapacityView from "./TeamCapacityView";


type SlotVisibilityTab = "capacity" | "activity" | "plans";

export default function SlotVisibilityPage() {
  const [activeTab, setActiveTab] =
    useState<SlotVisibilityTab>("capacity");

  const handleTabChange = (
    _event: React.SyntheticEvent,
    value: SlotVisibilityTab,
  ) => {
    setActiveTab(value);
  };

  return (
    <CommonContainer>
      <Box
        sx={{
          minHeight: "100%",
          backgroundColor: "#F4F3EF",
          color: "#1C1B19",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            height: "6vh",
            display: "flex",
            alignItems: "center",
            backgroundColor: "#1d2e3e",
            boxSizing: "border-box",
            p:4
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              minHeight: "100%",

              "& .MuiTabs-indicator": {
                display: "none",
              },

              "& .MuiTab-root": {
                minHeight: 40,
                minWidth: "auto",
                px: 2,
                mx: 0.25,
                borderRadius: 1,
                color: "#D8D5CC",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
              },

              "& .MuiTab-root.Mui-selected": {
                backgroundColor: "#383f71",
                color: "#FFFFFF",
              },

              "& .MuiTab-root:hover": {
                backgroundColor: "#2E2D29",
                color: "#FFFFFF",
              },
            }}
          >
            <Tab
              value="capacity"
              label="Team capacity"
            />

            <Tab
              value="activity"
              label="Check an activity"
            />

            <Tab
              value="plans"
              label="All plans"
            />
          </Tabs>
        </Box>

        {/* Content */}
        <Box>
          {activeTab === "capacity" && (
            <TeamCapacityView />
          )}

          {activeTab === "activity" && (
            <ActivityAvailabilityView />
          )}

          {activeTab === "plans" && (
            <AllPlansView />
          )}
        </Box>
      </Box>
    </CommonContainer>
  );
}