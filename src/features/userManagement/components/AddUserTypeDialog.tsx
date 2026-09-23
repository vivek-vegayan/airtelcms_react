import { Box, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { Close, Groups, PersonOutline, ChevronRight } from "@mui/icons-material";

export interface AddUserTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTeam: () => void;
  onSelectOther: () => void;
}

const OPTIONS = [
  {
    key: "team" as const,
    icon: <Groups sx={{ fontSize: 26 }} />,
    title: "Team User",
    description: "Full onboarding — employment details, designation and org hierarchy.",
  },
  {
    key: "other" as const,
    icon: <PersonOutline sx={{ fontSize: 26 }} />,
    title: "Other User",
    description: "Quick add — just OLM ID, name, email, mobile and role.",
  },
];

export default function AddUserTypeDialog({ open, onClose, onSelectTeam, onSelectOther }: AddUserTypeDialogProps) {
  const handleSelect = (key: "team" | "other") => (key === "team" ? onSelectTeam() : onSelectOther());

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "20px" } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, pt: 2.5, pb: 1 }}>
        <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Add New User</Typography>
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 1, pb: 3 }}>
        <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
          Choose the type of user you want to add.
        </Typography>

        <Stack gap={1.5}>
          {OPTIONS.map((opt) => (
            <Box
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                borderRadius: "14px",
                border: "1px solid",
                borderColor: "divider",
                cursor: "pointer",
                transition: "all 0.15s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: "action.hover",
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "primary.main",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : `${theme.palette.primary.main}14`,
                }}
              >
                {opt.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>{opt.title}</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{opt.description}</Typography>
              </Box>
              <ChevronRight sx={{ color: "text.disabled" }} />
            </Box>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
