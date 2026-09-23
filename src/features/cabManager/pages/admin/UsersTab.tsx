import {
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Table, TableBody, TableCell, TableHead, TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useGetAdminUsersQuery } from "../../api/cabManagerApiSlice";

const ACCESS_COLOR = {
  Approve: { bg: "#E8F5E9", fg: "#2E7D32" },
  Write:   { bg: "#E3F2FD", fg: "#1565C0" },
  Read:    { bg: "#F5F5F5", fg: "rgba(0,0,0,0.6)" },
} as const;

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function AdminUsersTab() {
  const { data, isLoading } = useGetAdminUsersQuery();

  return (
    <Paper sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }} elevation={0}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ fontWeight: 500 }}>Users &amp; Role Management</Typography>
        <Button size="small" variant="contained" startIcon={<AddIcon />}>Add user</Button>
      </Box>
      {isLoading ? (
        <Box sx={{ p: 2 }}><Skeleton variant="rounded" height={260} /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#FAFAFA" }}>
              <TableCell>User</TableCell>
              <TableCell>OLM ID</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Domain</TableCell>
              <TableCell>Access</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((u) => {
              const ac = ACCESS_COLOR[u.access];
              return (
                <TableRow key={u.olm}>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: "primary.main" }}>{initials(u.name)}</Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{u.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "'Roboto Mono', monospace", color: "text.secondary" }}>{u.olm}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.domain}</TableCell>
                  <TableCell><Chip size="small" label={u.access} sx={{ bgcolor: ac.bg, color: ac.fg, fontWeight: 500 }} /></TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={u.status === "active" ? "Active" : "Inactive"}
                      sx={{
                        bgcolor: u.status === "active" ? "#E8F5E9" : "#F5F5F5",
                        color:   u.status === "active" ? "#2E7D32" : "rgba(0,0,0,0.6)",
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}
