import React, { useState } from "react";
import { Route, BrowserRouter, Routes } from "react-router";
import { ColorModeContext, useMode } from "./style/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import AppLayout from "./components/layout/AppLayout";
import { Home } from "@mui/icons-material";
import AppRoutes from "./routes/AppRoutes";
import { PublicRoute } from "./routes/PublicRoute";
import LoginPage from "./features/auth/pages/LoginPage";
import { useAppSelector } from "./app/hooks";

const App: React.FC = () => {
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  const isHydrated = useAppSelector((s) => s.auth.hydrated);

  const [theme, colorMode] = useMode();
  const [dynamicHeaderText, setDynamicHeaderText] = useState("CHM");
  const [dynamicHeaderIcon, setDynamicHeaderIcon] = useState(<Home />);
  const [loading, setLoading] = useState(false);

  return (
    // BASE_URL comes from vite.config.ts's `base` (itself driven by the
    // VITE_APP_BASE_PATH env var), so this always matches wherever the app
    // is actually served from - no hardcoded deployment path here.
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/^\/|\/$/g, "")}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppLayout
            showChrome={isAuth && isHydrated}
            dynamicHeaderText={dynamicHeaderText}
            dynamicHeaderIcon={dynamicHeaderIcon}
            setLoading={setLoading}
            loading={loading}
          >
            <Routes>
              <Route
                path="/login"
                element={<PublicRoute element={<LoginPage />} />}
              />
              <Route
                path="/*"
                element={
                  <AppRoutes
                    setDynamicHeaderText={setDynamicHeaderText}
                    setDynamicHeaderIcon={setDynamicHeaderIcon}
                  />
                }
              />
            </Routes>
          </AppLayout>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </BrowserRouter>
  );
};
export default App;
