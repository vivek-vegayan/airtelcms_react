import { Box, Button, Stack, Typography, alpha, useTheme } from "@mui/material";
import { PersonSearch, PersonAddAlt1, RestartAlt } from "@mui/icons-material";
import { motion } from "framer-motion";

export default function EmptyState({
  onAddUser,
  onResetFilters,
  showResetFilters = true,
  showAddUser = true,
}: {
  onAddUser: () => void;
  onResetFilters?: () => void;
  showResetFilters?: boolean;
  /** Roles without create rights get the same empty state minus the CTA. */
  showAddUser?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      sx={{ py: { xs: 3, md: 6 }, px: 3, textAlign: "center" }}
    >
      <Box
        sx={{
          width: 84,
          height: 84,
          mx: "auto",
          mb: 2.5,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark
            ? alpha(theme.palette.primary.main, 0.16)
            : "linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)",
        }}
      >
        <PersonSearch sx={{ fontSize: 40, color: "primary.main" }} />
      </Box>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "text.primary" }}>
        No users found
      </Typography>
      <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5, maxWidth: 340, mx: "auto" }}>
        We couldn't find any users matching your current search or filters.
        {showAddUser
          ? " Try adjusting them, or add a new user to get started."
          : " Try adjusting them to widen the results."}
      </Typography>
      <Stack direction="row" justifyContent="center" gap={1.5} mt={{ xs: 2, md: 3 }}>
        {showResetFilters && onResetFilters && (
          <Button
            variant="outlined"
            startIcon={<RestartAlt sx={{ fontSize: 16 }} />}
            onClick={onResetFilters}
            sx={{ borderRadius: "10px", fontWeight: 600, borderColor: "divider" }}
          >
            Reset Filters
          </Button>
        )}
        {showAddUser && (
          <Button
            variant="contained"
            startIcon={<PersonAddAlt1 sx={{ fontSize: 16 }} />}
            onClick={onAddUser}
            sx={{ borderRadius: "10px", fontWeight: 700 }}
          >
            Add User
          </Button>
        )}
      </Stack>
    </Box>
  );
}
