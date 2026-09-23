import React, { useState } from "react";
import {
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Backdrop,
  CircularProgress,
  TextField,
  Autocomplete,
  Chip,
  Typography,
  Modal,
} from "@mui/material";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import {
  CheckCircle,
  Block,
  CalendarMonth,
  Layers,
  Language,
} from "@mui/icons-material";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { usePageLoading, useLoadingVisibility } from "../../../../../components/loading/LoadingProvider";

// ─── Design tokens ─────────────────────────────────────────────────────────
const T = {
  navy: "#0d1b2a",
  navyMid: "#1b2e45",
  accent: "#1560bd",
  accentL: "#e8f0fc",
  success: "#1b6b3a",
  successL: "#e6f4ea",
  warning: "#9a4b00",
  warningL: "#fff3e0",
  border: "#d8dde8",
  borderH: "#8fa0bc",
  bg: "#f4f6fa",
  surface: "#ffffff",
  label: "#5a6680",
  muted: "#7a869a",
  text: "#0d1b2a",
  rowBg: "#f9fafc",
  font: "'IBM Plex Sans', 'Segoe UI', sans-serif",
  radius: "6px",
  inputH: "36px",
};

// ─── Localizer ──────────────────────────────────────────────────────────────
const localizer = momentLocalizer(moment);

// ─── Static mock data ───────────────────────────────────────────────────────
const DOMAIN_OPTIONS = [
  "IP/MPLS",
  "Optical",
  "Access",
  "Metro-Ethernet",
  "Microwave",
];
const LAYER_OPTIONS = {
  "IP/MPLS": ["L3-VPN", "L2-VPN", "BGP", "OSPF"],
  Optical: ["OTN", "DWDM", "SDH"],
  Access: ["xDSL", "GPON", "EPON"],
  "Metro-Ethernet": ["VPLS", "EVPN", "QinQ"],
  Microwave: ["PDH", "SDH-MW", "E-band"],
};

const MOCK_SLOTS = [
  {
    title: "Slot-1",
    start: new Date(2025, 8, 13, 10, 0),
    end: new Date(2025, 8, 13, 12, 0),
    allDay: false,
    status: "available",
    index: 0,
    label: "Morning Window · 10:00–12:00",
  },
  {
    title: "Slot-2",
    start: new Date(2025, 8, 14, 9, 0),
    end: new Date(2025, 8, 14, 11, 30),
    allDay: false,
    status: "booked",
    index: 1,
    label: "Morning Window · 09:00–11:30",
  },
  {
    title: "Slot-3",
    start: new Date(2025, 8, 16, 14, 0),
    end: new Date(2025, 8, 16, 16, 0),
    allDay: false,
    status: "available",
    index: 2,
    label: "Afternoon Window · 14:00–16:00",
  },
  {
    title: "Slot-4",
    start: new Date(2025, 8, 18, 8, 0),
    end: new Date(2025, 8, 18, 10, 0),
    allDay: false,
    status: "available",
    index: 3,
    label: "Early Morning · 08:00–10:00",
  },
];

// ─── Styled input sx ────────────────────────────────────────────────────────
const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: T.radius,
    background: T.rowBg,
    fontSize: "12.5px",
    height: T.inputH,
    "& fieldset": { borderColor: T.border },
    "&:hover fieldset": { borderColor: T.borderH },
    "&.Mui-focused fieldset": { borderColor: T.accent, borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": {
    fontSize: "12px",
    color: T.muted,
    transform: "translate(12px, 8px) scale(1)",
    "&.MuiInputLabel-shrink": {
      transform: "translate(12px, -7px) scale(0.82)",
      color: T.label,
    },
    "&.Mui-focused": { color: T.accent },
  },
  "& .MuiOutlinedInput-input": {
    padding: "0 12px",
    height: T.inputH,
    boxSizing: "border-box",
    fontSize: "12.5px",
    color: T.text,
  },
};

// ─── Event component ────────────────────────────────────────────────────────
const EventComponent = ({ event }) => {
  const avail = event.status === "available";
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        px: "6px",
        py: "2px",
        borderRadius: "4px",
        background: avail ? T.successL : T.warningL,
        border: `1px solid ${avail ? "#a8d5b5" : "#f5c58a"}`,
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {avail ? (
        <CheckCircle sx={{ fontSize: "11px", color: T.success }} />
      ) : (
        <Block sx={{ fontSize: "11px", color: "#b45309" }} />
      )}
      <Typography
        sx={{
          fontSize: "11px",
          fontWeight: 600,
          fontFamily: T.font,
          color: avail ? T.success : T.warning,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {event.title}
      </Typography>
    </Box>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────
export const Slotassignmentviewnew = () => {
  const [view, setView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 1));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  // Register with the shared priority system so this in-page "fetching
  // slots" overlay never stacks on top of (or under) the app's real Global
  // Loader — see useLoadingVisibility gate on the Backdrop below.
  usePageLoading(loading, "slot-assignment-availability-check");
  const { globalActive } = useLoadingVisibility();
  const [showCalendar, setShowCalendar] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [acceptedSlot, setAcceptedSlot] = useState(null);

  const [formData, setFormData] = useState({
    planId: "PLN-2025-00142",
    taskId: "TSK-0089",
    domain: "",
    layer: "",
  });

  const layerOptions = formData.domain
    ? LAYER_OPTIONS[formData.domain] || []
    : [];

  // Simulate "Request" API
  const handleRequest = (status, selectedEventIndex = 0) => {
    setErrorMessage("");
    setErrorModalOpen(false);

    if (!formData.domain || !formData.layer) {
      setErrorMessage(
        "Domain and Layer are mandatory before requesting a slot.",
      );
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (status === "NA") {
        setShowCalendar(true);
        setCurrentDate(MOCK_SLOTS[0].start);
      } else if (status === "accepted") {
        const slot = MOCK_SLOTS[selectedEventIndex];
        setAcceptedSlot(slot);
        setSelectedEvent(null);
        setShowCalendar(false);
        // goToNextStep() would be called here
      }
    }, 900);
  };

  const eventStyleGetter = (event) => ({
    style: {
      background: "transparent",
      border: "none",
      padding: "1px 2px",
    },
  });

  const legendItem = (color, bg, border, label) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: "2px",
          background: bg,
          border: `1px solid ${border}`,
        }}
      />
      <Typography sx={{ fontSize: "11px", color: T.muted, fontFamily: T.font }}>
        {label}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        fontFamily: T.font,
        background: T.bg,
        minHeight: "100vh",
        p: "24px 20px",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          background: T.surface,
          borderRadius: "10px",
          border: `1px solid ${T.border}`,
          boxShadow: "0 2px 12px rgba(13,27,42,0.07)",
          overflow: "hidden",
          maxWidth: 1100,
          mx: "auto",
        }}
      >
        {/* Header bar */}
        <Box
          sx={{
            background: T.navy,
            px: "24px",
            py: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "5px",
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CalendarMonth sx={{ fontSize: "15px", color: "#fff" }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#fff",
                fontFamily: T.font,
                lineHeight: 1.3,
              }}
            >
              Slot Assignment
            </Typography>
            <Typography
              sx={{
                fontSize: "10.5px",
                color: "rgba(255,255,255,0.5)",
                fontFamily: T.font,
              }}
            >
              Select and confirm a maintenance window
            </Typography>
          </Box>
          {acceptedSlot && (
            <Box
              sx={{
                ml: "auto",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                px: "10px",
                py: "4px",
                background: "rgba(27,107,58,0.4)",
                border: "1px solid rgba(27,107,58,0.6)",
                borderRadius: "5px",
              }}
            >
              <CheckCircle sx={{ fontSize: "12px", color: "#6fcf97" }} />
              <Typography
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#6fcf97",
                  fontFamily: T.font,
                }}
              >
                {acceptedSlot.title} Accepted
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ p: "18px 24px 20px" }}>
          {/* Filter row */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.4fr 1.4fr auto",
              gap: "10px",
              alignItems: "center",
              mb: "14px",
            }}
          >
            <TextField
              label="Plan ID"
              size="small"
              fullWidth
              value={formData.planId}
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
            <TextField
              label="Task ID"
              size="small"
              fullWidth
              value={formData.taskId}
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
            <Autocomplete
              freeSolo
              options={DOMAIN_OPTIONS}
              value={formData.domain}
              onInputChange={(_, v) =>
                setFormData((f) => ({ ...f, domain: v, layer: "" }))
              }
              onChange={(_, v) =>
                setFormData((f) => ({ ...f, domain: v || "", layer: "" }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Domain"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <Language
                        sx={{ fontSize: "14px", color: T.muted, mr: "4px" }}
                      />
                    ),
                  }}
                  sx={inputSx}
                />
              )}
            />
            <Autocomplete
              freeSolo
              options={layerOptions}
              value={formData.layer}
              onInputChange={(_, v) => setFormData((f) => ({ ...f, layer: v }))}
              onChange={(_, v) =>
                setFormData((f) => ({ ...f, layer: v || "" }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Layer"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <Layers
                        sx={{ fontSize: "14px", color: T.muted, mr: "4px" }}
                      />
                    ),
                  }}
                  sx={inputSx}
                />
              )}
            />
            <Button
              variant="contained"
              onClick={() => handleRequest("NA")}
              disabled={loading}
              sx={{
                fontFamily: T.font,
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "none",
                background: T.navy,
                height: T.inputH,
                px: "20px",
                borderRadius: T.radius,
                boxShadow: "0 2px 8px rgba(13,27,42,0.25)",
                whiteSpace: "nowrap",
                "&:hover": {
                  background: T.accent,
                  boxShadow: "0 3px 12px rgba(21,96,189,0.4)",
                },
                transition: "all 0.18s ease",
              }}
            >
              Request Slot
            </Button>
          </Box>

          <Divider sx={{ borderColor: "#edf0f7", mb: "16px" }} />

          {/* Calendar section */}
          {showCalendar && (
            <Box>
              {/* Legend + section label */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: "10px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.9px",
                    textTransform: "uppercase",
                    color: T.muted,
                    fontFamily: T.font,
                  }}
                >
                  Available Windows
                </Typography>
                <Box sx={{ display: "flex", gap: "14px" }}>
                  {legendItem(T.success, T.successL, "#a8d5b5", "Available")}
                  {legendItem(T.warning, T.warningL, "#f5c58a", "Booked")}
                </Box>
              </Box>

              <Box
                sx={{
                  border: `1px solid ${T.border}`,
                  borderRadius: "8px",
                  overflow: "hidden",
                  "& .rbc-calendar": { fontFamily: T.font },
                  "& .rbc-header": {
                    fontSize: "11px",
                    fontWeight: 700,
                    color: T.label,
                    padding: "8px 4px",
                    background: T.rowBg,
                    borderColor: T.border,
                  },
                  "& .rbc-today": { background: "#eef3ff" },
                  "& .rbc-off-range-bg": { background: "#f9fafc" },
                  "& .rbc-button-link": {
                    fontSize: "12px",
                    fontFamily: T.font,
                    color: T.text,
                  },
                  "& .rbc-toolbar button": {
                    fontFamily: T.font,
                    fontSize: "11.5px",
                    color: T.label,
                    border: `1px solid ${T.border}`,
                    borderRadius: "5px",
                    padding: "4px 10px",
                    "&:hover": {
                      background: T.accentL,
                      color: T.accent,
                      borderColor: T.accent,
                    },
                    "&.rbc-active": {
                      background: T.navy,
                      color: "#fff",
                      borderColor: T.navy,
                    },
                  },
                  "& .rbc-toolbar-label": {
                    fontFamily: T.font,
                    fontSize: "13px",
                    fontWeight: 700,
                    color: T.text,
                  },
                  "& .rbc-month-view": { borderColor: T.border },
                  "& .rbc-day-bg + .rbc-day-bg": { borderColor: T.border },
                  "& .rbc-month-row + .rbc-month-row": {
                    borderColor: T.border,
                  },
                }}
              >
                <Calendar
                  localizer={localizer}
                  events={MOCK_SLOTS}
                  startAccessor="start"
                  endAccessor="end"
                  date={currentDate}
                  onNavigate={(d) => setCurrentDate(d)}
                  view={view}
                  onView={(v) => setView(v)}
                  selectable
                  onSelectSlot={(s) => {
                    setCurrentDate(s.start);
                    setView(Views.DAY);
                  }}
                  onSelectEvent={(e) => setSelectedEvent(e)}
                  style={{ height: 480 }}
                  views={[Views.MONTH, Views.DAY]}
                  eventPropGetter={eventStyleGetter}
                  components={{ event: EventComponent }}
                />
              </Box>
            </Box>
          )}

          {/* Accepted slot summary */}
          {acceptedSlot && (
            <Box
              sx={{
                mt: "16px",
                p: "14px 16px",
                background: T.successL,
                border: `1px solid #a8d5b5`,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <CheckCircle sx={{ color: T.success, fontSize: "20px" }} />
              <Box>
                <Typography
                  sx={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: T.success,
                    fontFamily: T.font,
                  }}
                >
                  Slot Confirmed — {acceptedSlot.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "11.5px",
                    color: "#2d6a4f",
                    fontFamily: T.font,
                    mt: "1px",
                  }}
                >
                  {moment(acceptedSlot.start).format(
                    "ddd, DD MMM YYYY · HH:mm",
                  )}{" "}
                  → {moment(acceptedSlot.end).format("HH:mm")}
                  &nbsp;·&nbsp;Domain: <strong>{formData.domain}</strong>
                  &nbsp;·&nbsp;Layer: <strong>{formData.layer}</strong>
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Slot detail dialog */}
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        PaperProps={{
          sx: {
            borderRadius: "10px",
            border: `1px solid ${T.border}`,
            boxShadow: "0 8px 32px rgba(13,27,42,0.14)",
            fontFamily: T.font,
            minWidth: 340,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: T.navy,
            color: "#fff",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: T.font,
            py: "12px",
            px: "20px",
          }}
        >
          Slot Details
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important", pb: "8px", px: "20px" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              mb: "10px",
            }}
          >
            {selectedEvent?.status === "available" ? (
              <CheckCircle sx={{ color: T.success, fontSize: "18px" }} />
            ) : (
              <Block sx={{ color: "#b45309", fontSize: "18px" }} />
            )}
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                color: T.text,
                fontFamily: T.font,
              }}
            >
              {selectedEvent?.title}
            </Typography>
            <Chip
              label={
                selectedEvent?.status === "available" ? "Available" : "Booked"
              }
              size="small"
              sx={{
                ml: "auto",
                fontSize: "10px",
                fontWeight: 700,
                background:
                  selectedEvent?.status === "available"
                    ? T.successL
                    : T.warningL,
                color:
                  selectedEvent?.status === "available" ? T.success : T.warning,
                border: `1px solid ${selectedEvent?.status === "available" ? "#a8d5b5" : "#f5c58a"}`,
                borderRadius: "4px",
                height: "20px",
              }}
            />
          </Box>
          <Divider sx={{ borderColor: "#edf0f7", mb: "12px" }} />
          {[
            [
              "Start",
              selectedEvent
                ? moment(selectedEvent.start).format("ddd, DD MMM YYYY · HH:mm")
                : "",
            ],
            [
              "End",
              selectedEvent ? moment(selectedEvent.end).format("HH:mm") : "",
            ],
            ["Domain", formData.domain || "—"],
            ["Layer", formData.layer || "—"],
          ].map(([k, v]) => (
            <Box
              key={k}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: "7px",
              }}
            >
              <Typography
                sx={{ fontSize: "11.5px", color: T.muted, fontFamily: T.font }}
              >
                {k}
              </Typography>
              <Typography
                sx={{
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: T.text,
                  fontFamily: T.font,
                }}
              >
                {v}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: "20px", pb: "16px", pt: "4px", gap: "8px" }}>
          <Button
            onClick={() => setSelectedEvent(null)}
            sx={{
              fontFamily: T.font,
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "none",
              color: T.muted,
              border: `1px solid ${T.border}`,
              borderRadius: T.radius,
              px: "14px",
              py: "5px",
              "&:hover": { background: T.rowBg },
            }}
          >
            Cancel
          </Button>
          {selectedEvent?.status === "available" && (
            <Button
              variant="contained"
              onClick={() => handleRequest("accepted", selectedEvent?.index)}
              sx={{
                fontFamily: T.font,
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "none",
                background: T.success,
                borderRadius: T.radius,
                px: "16px",
                py: "5px",
                boxShadow: "none",
                "&:hover": { background: "#155a30" },
              }}
            >
              Accept Slot
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Error modal */}
      <Modal open={errorModalOpen} onClose={() => setErrorModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: T.surface,
            borderRadius: "10px",
            border: `1px solid ${T.border}`,
            boxShadow: "0 8px 32px rgba(13,27,42,0.16)",
            width: 380,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              background: "#fef2f2",
              borderBottom: "1px solid #fecaca",
              px: "20px",
              py: "12px",
            }}
          >
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#b91c1c",
                fontFamily: T.font,
              }}
            >
              Error
            </Typography>
          </Box>
          <Box sx={{ px: "20px", py: "16px" }}>
            <Typography
              sx={{
                fontSize: "12.5px",
                color: "#7f1d1d",
                fontFamily: T.font,
                lineHeight: 1.6,
              }}
            >
              {errorMessage}
            </Typography>
          </Box>
          <DialogActions sx={{ px: "20px", pb: "14px", pt: 0 }}>
            <Button
              onClick={() => setErrorModalOpen(false)}
              sx={{
                fontFamily: T.font,
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "none",
                background: T.navy,
                color: "#fff",
                borderRadius: T.radius,
                px: "16px",
                py: "5px",
                "&:hover": { background: T.accent },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Box>
      </Modal>

      {/* Loading backdrop — suppressed if the app's Global Loader is active */}
      <Backdrop open={loading && !globalActive} sx={{ zIndex: 9999 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <CircularProgress size={32} sx={{ color: "#fff" }} />
          <Typography
            sx={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.8)",
              fontFamily: T.font,
            }}
          >
            Fetching available slots…
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};
