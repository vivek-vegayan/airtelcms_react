import { useMemo } from "react";
import {
  Grid,
  Card,
  Typography,
  Box,
  Autocomplete,
  TextField,
  Fade,
} from "@mui/material";

import ApartmentIcon from "@mui/icons-material/Apartment";
import GroupsIcon from "@mui/icons-material/Groups";
import HubIcon from "@mui/icons-material/Hub";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

import type {
  OrgFilterOption,
  OrgFilterValues,
} from "../../../orgHierarchy/types/orgHierarchy.types";

interface Props {
  hierarchy: OrgFilterValues;
  setHierarchy: (value: OrgFilterValues) => void;
  hierarchyData: any;
  loading?: boolean;
  errors?: Record<string, string>;
}

export const HierarchySelector = ({
  hierarchy,
  setHierarchy,
  hierarchyData,
  loading = false,
  errors = {},
}: Props) => {
  // ================= DATA =================

  const verticals = hierarchyData?.data?.verticals ?? [];
  const functions = hierarchyData?.data?.teamFunction ?? [];
  const domains = hierarchyData?.data?.domains ?? [];
  const subDomains = hierarchyData?.data?.subDomains ?? [];

  // ================= OPTIONS =================

  const verticalOptions: OrgFilterOption[] = useMemo(
    () => verticals.map((v: any) => ({ label: v.name, value: v.id })),
    [verticals],
  );

  const functionOptions: OrgFilterOption[] = useMemo(
    () =>
      functions
        .filter((f: any) => f.verticalId === hierarchy.vertical)
        .map((f: any) => ({ label: f.name, value: f.id })),
    [functions, hierarchy.vertical],
  );

  const domainOptions: OrgFilterOption[] = useMemo(
    () =>
      domains
        .filter((d: any) => d.functionId === hierarchy.teamFunction)
        .map((d: any) => ({ label: d.name, value: d.id })),
    [domains, hierarchy.teamFunction],
  );

  const subDomainOptions: OrgFilterOption[] = useMemo(
    () =>
      subDomains
        .filter((s: any) => s.domainId === hierarchy.domain)
        .map((s: any) => ({ label: s.name, value: s.id })),
    [subDomains, hierarchy.domain],
  );

  // ================= CHANGE HANDLER =================

  const handleChange = (key: keyof OrgFilterValues, value?: number | null) => {
    const next: OrgFilterValues = { ...hierarchy };

    if (!value) {
      delete next[key];
    } else {
      next[key] = value;
    }

    if (key === "vertical") {
      delete next.teamFunction;
      delete next.domain;
      delete next.subDomain;
    }

    if (key === "teamFunction") {
      delete next.domain;
      delete next.subDomain;
    }

    if (key === "domain") {
      delete next.subDomain;
    }

    setHierarchy(next);
  };

  // ================= UI =================

  return (
    <Card
      elevation={0}
      sx={{
        p: 1,
        borderRadius: 3,
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3))",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,0,0,0.05)",
      }}
    >
      <Typography variant="h6" fontWeight={600} mb={2}>
        Organization Hierarchy
      </Typography>

      <Grid container spacing={2}>
        {/* ================= VERTICAL ================= */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            size="small"
            options={verticalOptions}
            loading={loading}
            value={
              verticalOptions.find((v) => v.value === hierarchy.vertical) ||
              null
            }
            onChange={(_, v) => handleChange("vertical", v?.value)}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Vertical"
                error={!!errors.vertical}
                helperText={errors.vertical}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <ApartmentIcon sx={{ mr: 1 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        {/* ================= FUNCTION ================= */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Fade in={!!hierarchy.vertical}>
            <Box>
              <Autocomplete
                size="small"
                options={functionOptions}
                disabled={!hierarchy.vertical}
                value={
                  functionOptions.find(
                    (f) => f.value === hierarchy.teamFunction,
                  ) || null
                }
                onChange={(_, v) => handleChange("teamFunction", v?.value)}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Team Function"
                    error={!!errors.teamFunction}
                    helperText={errors.teamFunction}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <GroupsIcon sx={{ mr: 1 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          </Fade>
        </Grid>

        {/* ================= DOMAIN ================= */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Fade in={!!hierarchy.teamFunction}>
            <Box>
              <Autocomplete
                size="small"
                options={domainOptions}
                disabled={!hierarchy.teamFunction}
                value={
                  domainOptions.find((d) => d.value === hierarchy.domain) ||
                  null
                }
                onChange={(_, v) => handleChange("domain", v?.value)}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Domain"
                    error={!!errors.domain}
                    helperText={errors.domain}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <HubIcon sx={{ mr: 1 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          </Fade>
        </Grid>

        {/* ================= SUB DOMAIN ================= */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Fade in={!!hierarchy.domain}>
            <Box>
              <Autocomplete
                size="small"
                options={subDomainOptions}
                disabled={!hierarchy.domain}
                value={
                  subDomainOptions.find(
                    (s) => s.value === hierarchy.subDomain,
                  ) || null
                }
                onChange={(_, v) => handleChange("subDomain", v?.value)}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Sub Domain"
                    error={!!errors.subDomain}
                    helperText={errors.subDomain}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <AccountTreeIcon sx={{ mr: 1 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          </Fade>
        </Grid>
      </Grid>
    </Card>
  );
};
