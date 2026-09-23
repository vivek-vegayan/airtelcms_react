import React from "react";
import { Paper, Typography, Stack, Box, Divider } from "@mui/material";
import RouterIcon from "@mui/icons-material/Router";
import LanIcon from "@mui/icons-material/Lan";

import DataTable from "./DataTable";
import type { CheckpointItem } from "../../../../types/checkpoint.types";

interface Props {
  item: CheckpointItem;
}

/** Turns an arbitrary key like "node_details" into "Node Details". */
const formatTitle = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Renders one arbitrary field of the item's JSON as a table: an array of
 * objects becomes rows under that array's own keys; a single nested object
 * is flattened to one row. Table headers keep the raw API key names
 * on purpose - they're what the validation script itself calls each field.
 */
const renderDynamicSection = (key: string, value: unknown) => {
  if (!value) return null;

  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
    const headers = Object.keys(value[0] as Record<string, unknown>);
    const rows = value.map((row) =>
      headers.map((h) => (row as Record<string, unknown>)[h] as string | number | null),
    );
    return (
      <Box sx={{ mt: 1.25 }} key={key}>
        <Typography variant="subtitle2" sx={{ mb: 0.6, fontSize: 12, fontWeight: 600, color: "text.secondary" }}>
          {formatTitle(key)}
        </Typography>
        <DataTable headers={headers} rows={rows} />
      </Box>
    );
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const flatEntries: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "object" && v !== null) {
        for (const [innerK, innerV] of Object.entries(v as Record<string, unknown>)) {
          flatEntries[`${k}.${innerK}`] = innerV;
        }
      } else {
        flatEntries[k] = v;
      }
    }
    const headers = Object.keys(flatEntries);
    const rows = [Object.values(flatEntries) as (string | number | null)[]];
    return (
      <Box sx={{ mt: 1.25 }} key={key}>
        <Typography variant="subtitle2" sx={{ mb: 0.6, fontSize: 12, fontWeight: 600, color: "text.secondary" }}>
          {formatTitle(key)}
        </Typography>
        <DataTable headers={headers} rows={rows} />
      </Box>
    );
  }

  return null;
};

const CheckpointItemCard: React.FC<Props> = ({ item }) => {
  const borderColor =
    item.status === "Pass"
      ? "success.main"
      : item.status === "Fail"
        ? "error.main"
        : "divider";

  return (
    <Paper
      variant="outlined"
      sx={{
        borderLeft: 4,
        borderLeftColor: borderColor,
        p: 1.5,
        borderRadius: 1.5,
        overflow: "auto",
        transition: "box-shadow .2s ease",
        "&:hover": { boxShadow: 2 },
      }}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <RouterIcon color="primary" fontSize="small" />
          <Typography fontWeight={700} sx={{ fontSize: 13 }}>
            {item.node} — <LanIcon fontSize="small" sx={{ verticalAlign: "middle" }} /> {item.interface}
          </Typography>
        </Stack>

        <Divider sx={{ my: 0.5 }} />

        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11.5 }}>
          Node Data
        </Typography>

        {Object.entries(item).map(([key, value]) => {
          if (["node", "interface", "status"].includes(key)) return null;
          return renderDynamicSection(key, value);
        })}
      </Stack>
    </Paper>
  );
};

export default CheckpointItemCard;
