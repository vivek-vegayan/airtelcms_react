import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Tooltip,
  Box,
  useTheme,
} from "@mui/material";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";

interface Props {
  headers: string[];
  rows: (string | number | null)[][];
  title?: string;
}

const DataTable: React.FC<Props> = ({ headers, rows, title }) => {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        mb: 2,
        borderColor: theme.palette.divider,
      }}
    >
      {title && (
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.03)"
                : "#f6f8fa",
          }}
        >
          <TableChartOutlinedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={700}>
            {title}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "25vh",
          width: "100%",
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {headers.map((header, i) => (
                <TableCell
                  key={i}
                  sx={{
                    bgcolor:
                      theme.palette.mode === "dark" ? "#2a2a2a" : "#f7f7f7",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    letterSpacing: 0.3,
                    whiteSpace: "nowrap",
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length} align="center">
                  No Data Available
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={i} hover>
                  {row.map((value, j) => (
                    <TableCell key={j} sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title={String(value ?? "—")} arrow>
                        <span>{value ?? "—"}</span>
                      </Tooltip>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
};

export default DataTable;
