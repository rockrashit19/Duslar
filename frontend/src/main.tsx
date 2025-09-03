import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./state/auth";
import { ToastProvider } from "./state/toast";
import { ErrorBoundary } from "./state/ErrorBoundary";
import OfflineBar from "./components/OfflineBar";
import "./styles/reset.css";
import "./styles/global.css";
// import { applyTelegramTheme, bindThemeListener } from "./lib/telegramTheme";

// applyTelegramTheme();
// bindThemeListener();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <OfflineBar />
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </ToastProvider>
  </React.StrictMode>
);
