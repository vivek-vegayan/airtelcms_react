export const formatModuleName = (moduleKey: string) => {
  if (moduleKey === "SYSTEM_ALERTS") return "System Alerts";
  return moduleKey
    .replace(/_/g, " ")
    .replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
};
