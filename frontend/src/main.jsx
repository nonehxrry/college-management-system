import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <App />
            <Toaster
              position="top-right"
              gutter={8}
              containerStyle={{ top: 72 }}
              toastOptions={{
                duration: 3500,
                style: {
                  background: "#fff",
                  color: "#1f2937",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 24px -2px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.04)",
                  fontSize: "0.875rem",
                  fontFamily: "DM Sans, system-ui, sans-serif",
                  fontWeight: 500,
                  maxWidth: 400,
                  padding: "12px 16px",
                },
                success: {
                  iconTheme: { primary: "#10b981", secondary: "#fff" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "#fff" },
                  duration: 5000,
                },
              }}
            />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);