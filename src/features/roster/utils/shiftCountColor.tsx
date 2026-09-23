// Matches SHIFT_COLOR_MAP from RosterShiftCell exactly
export const getShiftCountColor = (shift: string) => {
  const s = shift?.trim().toUpperCase();

  switch (s) {
    case "G":
      return { bg: "#EEF5FF", border: "#C3D9FE", text: "#1E40AF", badge: "#3B82F6" };
    case "N":
      return { bg: "#F1F0FF", border: "#C0B8FD", text: "#3730A3", badge: "#6366F1" };
    case "B":
      return { bg: "#FFF8EE", border: "#FCD97D", text: "#854D0E", badge: "#F59E0B" };
    case "LG":
      return { bg: "#EDFBF3", border: "#9DECBF", text: "#065F46", badge: "#10B981" };
    case "A":
      return { bg: "#FFFCEE", border: "#FCE98D", text: "#78350F", badge: "#FBBF24" };
    case "L":
    case "LEAVE":
      return { bg: "#FEF0FA", border: "#F9C4E8", text: "#9D174D", badge: "#EC4899" };
    case "H":
    case "HOLIDAY":
      return { bg: "#FFF0F2", border: "#FECDD3", text: "#881337", badge: "#F43F5E" };
    case "C":
    case "COMP OFF":
      return { bg: "#F8FAFC", border: "#E2E8F0", text: "#475569", badge: "#94A3B8" };
    case "NJ":
    case "NEW JOINEE":
      return { bg: "#FFFBEB", border: "#FDE68A", text: "#78350F", badge: "#F59E0B" };
    case "W":
    case "WO":
    case "WEEK OFF":
      return { bg: "#F3F4F6", border: "#9CA3AF", text: "#4B5563", badge: "#6B7280" };
    case "TOTAL COUNT":
    case "TOTAL":
      return { bg: "#F0FDF4", border: "#BBF7D0", text: "#14532D", badge: "#16A34A" };
    default:
      return { bg: "#F9FAFB", border: "#E4E7EC", text: "#98A2B3", badge: "#D1D5DB" };
  }
};