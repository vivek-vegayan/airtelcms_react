import React from "react";
import { Box, Alert, Fade, Skeleton, Typography, useTheme } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { useCrqDetails } from "../hooks/useCrqDetails";
import { CrqDetailsSearchBar } from "../components/details/CrqDetailsSearchBar";
import { CrqDetailsInfoCard } from "../components/details/CrqDetailsInfoCard";
import { CrqStageTimeline } from "../components/details/CrqStageTimeline";
import { CrqEmptyState } from "../components/CrqEmptyState";

const DetailsSkeleton: React.FC = () => {
  const theme = useTheme();
  const cardSx = {
    borderRadius: "14px",
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.paper,
    overflow: "hidden",
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={cardSx}>
        <Skeleton variant="rectangular" height={52} />
        <Box sx={{ p: 2.5, display: "flex", flexWrap: "wrap", gap: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" width="100%" height={38} sx={{ flex: "1 1 160px" }} />
          ))}
        </Box>
      </Box>
      <Box sx={{ ...cardSx, p: "20px 24px" }}>
        <Skeleton variant="text" width={160} height={26} sx={{ mb: 2 }} />
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Skeleton variant="circular" width={76} height={76} />
        </Box>
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} sx={{ display: "flex", gap: 2, mb: 2.5 }}>
            <Skeleton variant="circular" width={26} height={26} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="35%" height={20} />
              <Skeleton variant="text" width="55%" height={16} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const CrqDetailsPage: React.FC = () => {
  const {
    roleName,
    values,
    options,
    handleChange,
    crqOptions,
    isLoadingCrqs,
    selectedCrq,
    handleSelectCrq,
    details,
    isLoading,
    error,
  } = useCrqDetails();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* page header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 0.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: (theme) =>
              theme.palette.mode === "dark" ? `${theme.palette.primary.main}22` : `${theme.palette.primary.main}14`,
          }}
        >
          <AccountTreeIcon sx={{ fontSize: 20, color: "primary.main" }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 16.5, fontWeight: 700, color: "text.primary", lineHeight: 1.25 }}>
            CRQ Journey Timeline
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
            Look up a Change Request to trace its full stage-by-stage history.
          </Typography>
        </Box>
      </Box>

      <CrqDetailsSearchBar
        role={roleName}
        values={values}
        options={options}
        onFilterChange={handleChange}
        crqOptions={crqOptions}
        isLoadingCrqs={isLoadingCrqs}
        value={selectedCrq}
        onChange={handleSelectCrq}
      />

      {isLoading && <DetailsSkeleton />}

      {error && !isLoading && (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!selectedCrq && !isLoading && (
        <CrqEmptyState
          title="No CRQ Looked Up"
          subtitle="Pick a Sub Domain and search for a CRQ number above to view its full details and workflow timeline."
        />
      )}

      {details && !isLoading && !error && (
        <Fade in key={details.info?.crqNo ?? "details"} timeout={350}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {details.info && <CrqDetailsInfoCard info={details.info} stages={details.stages} />}
            <CrqStageTimeline stages={details.stages} />
          </Box>
        </Fade>
      )}
    </Box>
  );
};
