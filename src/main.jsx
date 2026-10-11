import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { StoreProvider } from "./store.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

// Notun deploy-er por purono tab-e lazy chunk (jemon PlatformPlans-xxxx.js) 404 hoy —
// Vite "vite:preloadError" dey. Tokhon ekbar auto-reload kore fresh asset niye ni.
window.addEventListener("vite:preloadError", () => {
  if (!sessionStorage.getItem("ispora_chunk_reload")) {
    sessionStorage.setItem("ispora_chunk_reload", "1");
    window.location.reload();
  }
});
window.addEventListener("load", () => sessionStorage.removeItem("ispora_chunk_reload"));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
          <App />
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
