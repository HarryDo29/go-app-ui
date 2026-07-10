import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CookiesProvider } from "react-cookie";
import { AuthProvider } from "./lib/auth-context";
import { WebSocketProvider } from "./lib/websocket-context";
import { ThemeProvider } from "./lib/theme-context";
import { Toaster } from "./components/ui/sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatApp from "./routes/index";
import LoginPage from "./routes/login";
import RegisterPage from "./routes/register";
import NotFound from "./routes/not-found";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CookiesProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <WebSocketProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <ChatApp />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </WebSocketProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </CookiesProvider>
    </QueryClientProvider>
  </StrictMode>,
);
