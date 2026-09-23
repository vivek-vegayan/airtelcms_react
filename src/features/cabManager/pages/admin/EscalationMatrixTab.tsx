import {
  Box,
  Paper,
  Skeleton,
  Table, TableBody, TableCell, TableHead, TableRow,
  Typography,
} from "@mui/material";
import { useGetEscalationMatrixQuery } from "../../api/cabManagerApiSlice";

export function AdminEscalationMatrixTab() {
  const { data, isLoading } = useGetEscalationMatrixQuery();

  return (
    <Paper sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }} elevation={0}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography sx={{ fontWeight: 500 }}>Delegation &amp; Escalation Matrix — SLA per stage</Typography>
      </Box>
      {isLoading ? (
        <Box sx={{ p: 2 }}><Skeleton variant="rounded" height={200} /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#FAFAFA" }}>
              <TableCell>Approval Stage</TableCell>
              <TableCell>L1 SLA</TableCell>
              <TableCell>L2 SLA</TableCell>
              <TableCell>L3 SLA</TableCell>
              <TableCell>Escalation Path</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((row) => (
              <TableRow key={row.stage}>
                <TableCell sx={{ fontWeight: 500 }}>{row.stage}</TableCell>
                <TableCell sx={{ fontFamily: "'Roboto Mono', monospace", color: "#2E7D32" }}>{row.l1}</TableCell>
                <TableCell sx={{ fontFamily: "'Roboto Mono', monospace", color: "#ED6C02" }}>{row.l2}</TableCell>
                <TableCell sx={{ fontFamily: "'Roboto Mono', monospace", color: "#C62828" }}>{row.l3}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{row.notify}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}
