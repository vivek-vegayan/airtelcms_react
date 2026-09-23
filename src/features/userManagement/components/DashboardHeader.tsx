import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { PersonAddAlt1, UploadFile, Download, Refresh } from "@mui/icons-material";

export interface DashboardHeaderProps {
  onAddUser: () => void;
  onImport: () => void;
  onExport: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
  exporting?: boolean;
  /** When false the Add User action is hidden entirely (roles that may read
   *  the directory but not create users). */
  canAddUser?: boolean;
  /** Row count for the current filter, shown as a chip beside the title. */
  totalUsers?: number;
}

export default function DashboardHeader({
  onAddUser,
  onImport,
  onExport,
  onRefresh,
  refreshing = false,
  exporting = false,
  canAddUser = true,
  totalUsers,
}: DashboardHeaderProps) {
  return (
    <Box sx={{ mb: 1, flexShrink: 0 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        gap={1}
      >
        {/* The breadcrumb that used to sit here read "Admin › User Management"
            with a dead "#" link, directly under a tab strip already labelled
            User Management — two navigational claims for one location, one of
            them non-functional. */}
        <Stack direction="row" alignItems="baseline" gap={1} flexWrap="wrap">
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 700,
              color: "text.primary",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            User Directory
          </Typography>
          {totalUsers !== undefined && (
            <Chip
              label={totalUsers.toLocaleString()}
              size="small"
              sx={{ height: 19, fontSize: 11, fontWeight: 700, bgcolor: "action.hover" }}
            />
          )}
          <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
            Manage roles, permissions and team access
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
          <Tooltip title="Import users from a spreadsheet">
            <Button
              size="small"
              variant="outlined"
              startIcon={<UploadFile sx={{ fontSize: 15 }} />}
              onClick={onImport}
              sx={{
                borderRadius: "8px",
                borderColor: "divider",
                color: "text.secondary",
                fontWeight: 600,
                textTransform: "none",
                py: 0.4,
                minWidth: 0,
                px: { xs: 1, sm: 1.5 },
                "& .MuiButton-startIcon": { mr: { xs: 0, sm: 0.75 } },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Import
              </Box>
            </Button>
          </Tooltip>

          <Tooltip title="Export the current filter as CSV">
            <span>
              <Button
                size="small"
                variant="outlined"
                disabled={exporting}
                startIcon={
                  exporting ? (
                    <CircularProgress size={13} color="inherit" />
                  ) : (
                    <Download sx={{ fontSize: 15 }} />
                  )
                }
                onClick={onExport}
                sx={{
                  borderRadius: "8px",
                  borderColor: "divider",
                  color: "text.secondary",
                  fontWeight: 600,
                  textTransform: "none",
                  py: 0.4,
                  minWidth: 0,
                  px: { xs: 1, sm: 1.5 },
                  "& .MuiButton-startIcon": { mr: { xs: 0, sm: 0.75 } },
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  Export
                </Box>
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={onRefresh}
              aria-label="Refresh user list"
              sx={{
                borderRadius: "8px",
                border: "1px solid",
                borderColor: "divider",
                width: 30,
                height: 30,
              }}
            >
              <Refresh
                sx={{
                  fontSize: 15,
                  color: "text.secondary",
                  animation: refreshing ? "umRefreshSpin 0.8s linear infinite" : "none",
                  "@keyframes umRefreshSpin": { to: { transform: "rotate(360deg)" } },
                }}
              />
            </IconButton>
          </Tooltip>

          {canAddUser && (
            <Button
              size="small"
              variant="contained"
              disableElevation
              startIcon={<PersonAddAlt1 sx={{ fontSize: 15 }} />}
              onClick={onAddUser}
              sx={{
                borderRadius: "8px",
                fontWeight: 700,
                textTransform: "none",
                px: { xs: 1.5, sm: 2 },
                py: 0.4,
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Add User
              </Box>
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                Add
              </Box>
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
