import { useEffect, useState } from "react";
import { Alert, Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTabColorTokens } from "../../../style/theme";
import { useGetDashboardQuery } from "../api/cabManagerApiSlice";
import { errMsg } from "../components/shared/errMsg";
import { CabKpiCard } from "../components/dashboard/CabKpiCard";
import { PipelineStagesCard } from "../components/dashboard/PipelineStagesCard";
import { SlaWatchCard } from "../components/dashboard/SlaWatchCard";

export function CabDashboardPage() {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const [mounted, setMounted] = useState(false);
  const { data, isLoading, isError, error, refetch } = useGetDashboardQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isError) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={() => void refetch()}>Retry</Button>}
      >
        {errMsg(error)}
      </Alert>
    );
  }

  if (isLoading || !data) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={52} width={280} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={112} sx={{ borderRadius: "14px" }} />)}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" }, gap: 2 }}>
          <Skeleton variant="rounded" height={320} sx={{ borderRadius: "16px" }} />
          <Skeleton variant="rounded" height={320} sx={{ borderRadius: "16px" }} />
        </Box>
      </Stack>
    );
  }

  return (
    <Box>
      {/* KPI tiles */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        {data.kpis.map((k, i) => (
          <CabKpiCard key={k.label} kpi={k} colors={colors} mounted={mounted} delay={0.04 * i} />
        ))}
      </Box>

      {/* Pipeline + SLA watch */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" }, gap: 2, alignItems: "stretch" }}>
        <PipelineStagesCard stageBars={data.stageBars} colors={colors} mounted={mounted} delay={0.16} />
        <SlaWatchCard escalations={data.escalations} colors={colors} mounted={mounted} delay={0.2} />
      </Box>
    </Box>
  );
}
