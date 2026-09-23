import React, { useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import NetworkFreezeTable from "../components/Networkfreezetable";
import { HolidayListTable } from "../components/Holidaylisttable";

const HolidayAndNetworkScheduleManagerMain: React.FC = () => {
  const [refreshHolidayList, setRefreshHolidayList] = useState(false);
  const theme = useTheme();

  const handleRefreshHolidayList = () => {
    setRefreshHolidayList((prev) => !prev);
  };

  return (
    <Box>
      {/* ── Page Header ── */}
    
      {/* ── Two-column layout ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        <NetworkFreezeTable onRefresh={handleRefreshHolidayList} />
        <HolidayListTable />
      </Box>
    </Box>
  );
};

export default HolidayAndNetworkScheduleManagerMain;