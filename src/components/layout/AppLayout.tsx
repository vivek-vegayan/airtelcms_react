import React, { useCallback, useState, type JSX } from "react";
import Header from "./Header";
import SideBar from "./SideBar";
import { AppScrollView } from "../ui/AppScrollView";

interface AppLayoutProps {
  /** Whether to render Header/SideBar chrome at all (false while unauthenticated/pre-hydration). */
  showChrome: boolean;
  dynamicHeaderText: string;
  dynamicHeaderIcon?: JSX.Element;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  children: React.ReactNode;
}

/**
 * The app shell: fixed Header + Sidebar (permanent/collapsed on desktop,
 * off-canvas temporary drawer on mobile) around a scrollable content area.
 * Owns only presentation/layout state (sidebar collapse, mobile drawer
 * open) — auth gating and route composition stay in App.tsx.
 */
const AppLayout: React.FC<AppLayoutProps> = ({
  showChrome,
  dynamicHeaderText,
  dynamicHeaderIcon,
  setLoading,
  loading,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleSidebarCollapseToggle = useCallback(
    () => setIsSidebarCollapsed((prev) => !prev),
    [],
  );
  const handleMobileNavToggle = useCallback(() => setIsMobileNavOpen((prev) => !prev), []);
  const handleMobileNavClose = useCallback(() => setIsMobileNavOpen(false), []);

  return (
    <div className="app">
      {showChrome && (
        <>
          <Header
            dynamicHeaderText={dynamicHeaderText}
            dynamicHeaderIcon={dynamicHeaderIcon}
            setLoading={setLoading}
            loading={loading}
            isSidebarCollapsed={isSidebarCollapsed}
            onMobileNavToggle={handleMobileNavToggle}
          />
          <SideBar
            isCollapsed={isSidebarCollapsed}
            onCollapseToggle={handleSidebarCollapseToggle}
            mobileOpen={isMobileNavOpen}
            onMobileClose={handleMobileNavClose}
          />
        </>
      )}

      <AppScrollView>
        <main className="content">{children}</main>
      </AppScrollView>
    </div>
  );
};

export default AppLayout;
