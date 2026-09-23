import React, { useEffect, useRef, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  CircularProgress,
  IconButton,
  Alert,
  Fade,
  Collapse,
  styled,
  Skeleton,
  Stack,
  Divider,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  alpha,
} from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ArticleIcon from "@mui/icons-material/Article";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { toast, type Id } from "react-toastify";
import CommonContainer from "../../../components/common/CommonContainer";
import {
  useGetAnalyticsReportDatesQuery,
  useGetAnalyticsReportsForDateQuery,
  useLazyDownloadAnalyticsReportQuery,
} from "../api/crqAnalyticsApi";
import type { AnalyticsReportType } from "../types/crqAnalytics.types";

const StepBox = styled(Paper, { shouldForwardProp: (prop) => prop !== "disabled" })<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    height: "100%",
    padding: theme.spacing(3),
    borderRadius: (theme.shape.borderRadius as number) * 3,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "none",
    backgroundColor: theme.palette.background.paper,
    transition: "opacity 0.3s ease, transform 0.3s ease",
    opacity: disabled ? 0.5 : 1,
    transform: disabled ? "scale(0.98)" : "scale(1)",
    display: "flex",
    flexDirection: "column",
  }),
);

const StepHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(2.5),
  gap: theme.spacing(1.5),
}));

const StepNumber = styled(Box)(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: "bold",
  fontSize: "1rem",
  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  padding: theme.spacing(1.2, 3),
  fontWeight: 600,
  letterSpacing: "0.5px",
  color: theme.palette.text.secondary,
  border: `1px solid ${theme.palette.divider} !important`,
  borderRadius: `${(theme.shape.borderRadius as number) * 2}px !important`,
  "&.Mui-selected, &.Mui-selected:hover": {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
  },
}));

const ReportListItem = styled(Paper)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1.5, 2),
  marginBottom: theme.spacing(1.5),
  border: "1px solid transparent",
  borderRadius: (theme.shape.borderRadius as number) * 2,
  backgroundColor: alpha(theme.palette.action.hover, 0.3),
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    transform: "translateY(-2px)",
    boxShadow: `0 4px 12px 0 rgba(0,0,0,0.05)`,
  },
}));

export default function AnalyticsReportsPage() {
  const [selectedType, setSelectedType] = useState<AnalyticsReportType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const toastIdRef = useRef<Id | null>(null);

  const { data: datesData, isLoading: isLoadingDates, isError: isDatesError } = useGetAnalyticsReportDatesQuery(
    selectedType!,
    { skip: !selectedType },
  );

  const { data: reportsData, isLoading: isLoadingReports, isError: isReportsError } = useGetAnalyticsReportsForDateQuery(
    { reportType: selectedType!, date: selectedDate },
    { skip: !selectedDate || !selectedType },
  );

  const [triggerDownload, { isFetching: isDownloading }] = useLazyDownloadAnalyticsReportQuery();

  useEffect(() => {
    setSelectedDate("");
  }, [selectedType]);

  const handleTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: AnalyticsReportType | null) => {
    setSelectedType(newType);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const handleDownload = async (fileName: string) => {
    if (!selectedType || !selectedDate) return;
    const finalFileName = `${fileName}_${selectedDate}.xlsx`;
    toastIdRef.current = toast.loading(`Downloading ${finalFileName}...`);

    try {
      const blob = await triggerDownload({ reportType: selectedType, date: selectedDate, fileName }).unwrap();

      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (toastIdRef.current) {
        toast.update(toastIdRef.current, {
          render: `${finalFileName} downloaded successfully!`,
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Download failed:", error);
      if (toastIdRef.current) {
        toast.update(toastIdRef.current, {
          render: `Failed to download ${fileName}. Please try again.`,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  };

  const renderDateSelection = () => {
    if (isLoadingDates) {
      return (
        <Stack spacing={1} sx={{ p: 2 }}>
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="70%" />
        </Stack>
      );
    }
    if (isDatesError) return <Alert severity="error">Error loading dates.</Alert>;

    if (datesData && datesData.availableDates.length > 0) {
      return (
        <FormControl component="fieldset" fullWidth>
          <Box sx={{ maxHeight: "300px", overflowY: "auto", p: 2 }}>
            <RadioGroup value={selectedDate} onChange={handleDateChange}>
              {datesData.availableDates.map((date) => (
                <FormControlLabel key={date} value={date} control={<Radio />} label={date} />
              ))}
            </RadioGroup>
          </Box>
        </FormControl>
      );
    }
    if (datesData && datesData.availableDates.length === 0) {
      return (
        <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
          No dates available for this report type.
        </Typography>
      );
    }
    return null;
  };

  const renderReportList = () => {
    if (isLoadingReports) {
      return (
        <Stack spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      );
    }
    if (isReportsError) return <Alert severity="error">Failed to load reports.</Alert>;

    if (reportsData?.availableReports.length === 0) {
      return (
        <Box sx={{ textAlign: "center", p: 4, color: "text.secondary" }}>
          <ErrorOutlineIcon sx={{ fontSize: 48, mb: 1.5 }} />
          <Typography variant="h6">No Reports Found</Typography>
          <Typography>There are no reports available for the selected date.</Typography>
        </Box>
      );
    }

    return (
      <Fade in={!isLoadingReports} timeout={500}>
        <Box sx={{ maxHeight: "350px", overflowY: "auto", pr: 1 }}>
          {reportsData?.availableReports.map((reportName) => (
            <ReportListItem key={reportName}>
              <ArticleIcon sx={{ mr: 2, color: "primary.main" }} />
              <Typography noWrap title={reportName} sx={{ flexGrow: 1, fontWeight: 500 }}>
                {reportName}
              </Typography>
              <IconButton
                edge="end"
                onClick={() => handleDownload(reportName)}
                disabled={isDownloading}
                color="primary"
                title={`Download ${reportName}`}
              >
                {isDownloading ? <CircularProgress size={24} /> : <CloudDownloadIcon />}
              </IconButton>
            </ReportListItem>
          ))}
        </Box>
      </Fade>
    );
  };

  const renderInitialState = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        textAlign: "center",
        color: "text.secondary",
        p: 3,
      }}
    >
      <TrackChangesIcon sx={{ fontSize: 60, mb: 2, color: "primary.main" }} />
      <Typography variant="h6" gutterBottom>
        Ready to find your report?
      </Typography>
      <Typography>Start by selecting a report type and date from the panels on the left.</Typography>
    </Box>
  );

  return (
    <CommonContainer>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StepBox>
            <StepHeader>
              <StepNumber>1</StepNumber>
              <Typography variant="h6" fontWeight="600">
                Select Type
              </Typography>
            </StepHeader>
            <ToggleButtonGroup
              color="primary"
              value={selectedType}
              exclusive
              onChange={handleTypeChange}
              fullWidth
              orientation="vertical"
              sx={{ gap: 1 }}
            >
              <StyledToggleButton value="daily">Daily</StyledToggleButton>
            </ToggleButtonGroup>
          </StepBox>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Collapse in={!!selectedType} timeout={400} sx={{ height: "100%" }}>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <StepBox disabled={!selectedType}>
                  <StepHeader>
                    <StepNumber>2</StepNumber>
                    <Typography variant="h6" fontWeight="600">
                      Select Date
                    </Typography>
                  </StepHeader>
                  <Box sx={{ flex: 1, overflow: "hidden" }}>{renderDateSelection()}</Box>
                </StepBox>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <StepBox disabled={!selectedDate}>
                  <StepHeader>
                    <StepNumber>3</StepNumber>
                    <Typography variant="h6" fontWeight="600" noWrap>
                      Available Reports
                    </Typography>
                  </StepHeader>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ flex: 1, overflow: "hidden" }}>{selectedDate ? renderReportList() : renderInitialState()}</Box>
                </StepBox>
              </Grid>
            </Grid>
          </Collapse>
        </Grid>
      </Grid>
    </CommonContainer>
  );
}
