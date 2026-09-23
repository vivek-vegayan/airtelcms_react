import { createRoot } from "react-dom/client";
import "./index.css";
// App-wide type family (also used standalone by LoginPage, which imports
// the same files again — CSS imports are idempotent, so that's harmless).
import "@fontsource/ibm-plex-sans/300.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { store } from "./app/store.ts";
import AuthHydrator from "./features/auth/utils/AuthHydrator.tsx";
import GlobalLoader from "./components/loading/GlobalLoader";
import { LoadingProvider } from "./components/loading/LoadingProvider";

createRoot(document.getElementById("root")!).render(
  <>
    <Provider store={store}>
      <LoadingProvider>
        <AuthHydrator />
        <GlobalLoader/>
        <App />
      </LoadingProvider>
      <ToastContainer
        autoClose={2000}
        closeOnClick
        pauseOnHover
        draggable
        position="top-right"
      />
    </Provider>
  </>
);
