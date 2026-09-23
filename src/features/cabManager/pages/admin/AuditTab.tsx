import { Box, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useGetAuditLogQuery } from "../../api/cabManagerApiSlice";

const TAG_COLOR = {
  create:   { bg: "#E3F2FD", fg: "#1565C0" },
  system:   { bg: "#F5F5F5", fg: "rgba(0,0,0,0.55)" },
  approve:  { bg: "#E8F5E9", fg: "#2E7D32" },
  reject:   { bg: "#FDECEA", fg: "#D32F2F" },
  delegate: { bg: "#E3F2FD", fg: "#1565C0" },
  escalate: { bg: "#FFF4E5", fg: "#ED6C02" },
} as const;

export function AdminAuditTab() {
  const { data, isLoading } = useGetAuditLogQuery();

  return (
    <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
      <Typography sx={{ fontWeight: 500, mb: 0.5 }}>CRQ Journey &amp; Audit Log</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 3 }}>
        Complete, read-only lifecycle trail — approvals, escalations, delegations and system events.
      </Typography>

      {isLoading ? (
        <Stack spacing={1.5}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={56} />)}</Stack>
      ) : (
        <Box sx={{ position: "relative", pl: 1 }}>
          {data?.map((a, i) => {
            const c = TAG_COLOR[a.tag];
            return (
              <Stack direction="row" spacing={2} key={i} sx={{ pb: 2 }}>
                <Stack alignItems="center" sx={{ flexShrink: 0 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: c.fg, mt: 0.5 }} />
                  {i < (data?.length ?? 0) - 1 && <Box sx={{ flex: 1, width: 2, bgcolor: "divider", mt: 0.5 }} />}
                </Stack>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.action}</Typography>
                    <Box sx={{ display: "inline-block", px: 1, py: 0.25, borderRadius: 0.75, bgcolor: c.bg, color: c.fg, fontSize: 11, fontWeight: 500 }}>
                      {a.stage}
                    </Box>
                  </Stack>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                    {a.actor} · <Box component="span" sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main" }}>{a.crq}</Box> · {a.time}
                  </Typography>
                </Box>
              </Stack>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
