// ─────────────────────────────────────────────
//  SFTP Management — feature barrel exports
// ─────────────────────────────────────────────

// Pages
export { default as SftpManagementMainPageTab } from "./pages/SftpManagementMainPageTab";
export { default as WindowsSftpPage } from "./pages/WindowsSftpPage";
export { default as LinuxSftpPage } from "./pages/LinuxSftpPage";

// Components
export { default as FileManagerPanel } from "./components/FileManagerPanel";
export { default as RemoteTmpBrowserPanel } from "./components/RemoteTmpBrowserPanel";

// API hooks + slice
export * from "./api/sftpApiSlice";

// Types
export type * from "./types/sftp.types";
