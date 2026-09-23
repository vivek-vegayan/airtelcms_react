
// Maps your API's moduleName strings to the route paths in AppRoutes
// Keep these in sync with your Route paths
export const MODULE_ROUTE_MAP: Record<string, string[]> = {
  "User Management":            ["/user-management"],
  "Organization Hierarchy":     ["/team"],
  "Roster Managemement":        ["/roster", "/generateroster"],  // note: API has typo, keep it
  "Inbox":                      ["/inbox"],
  "Role-Based Access Control":  ["/scheduler"],
  "Cab Manager":                ["/cabmanager"],
  "CRQ Analytics":              ["/analytics"],
  "SFTP Management":            ["/sftp-management"],
  "Authentication":             [],  // auth module — no dedicated route
};

// Which module is required to access each route prefix
export const ROUTE_MODULE_MAP: Record<string, string> = {
  "/user-management":  "User Management",
  "/team":             "Organization Hierarchy",
  "/roster":           "Roster Managemement",
  "/generateroster":   "Roster Managemement",
  "/scheduler":        "Role-Based Access Control",
  "/cabmanager":       "Cab Manager",
  "/analytics":        "CRQ Analytics",
  "/sftp-management":  "SFTP Management",
  "/inbox":            "Inbox",
  "/me":               null,   // available to all authenticated users
  "/home":             null,   // available to all
};