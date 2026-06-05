import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

import type { UserProfile, LoginRequest } from "@/lib/auth-types";
import { loginApi, getMeApi } from "@/lib/api/auth";
import { getCookie, setCookie, removeCookie } from "@/lib/cookies";

// ─── Cookie keys ────────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_PROFILE_KEY = "user_profile";

// ─── Context shape ──────────────────────────────────────────────────────────
interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (creds: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate session from cookies on mount
  useEffect(() => {
    const hydrate = async () => {
      const token = getCookie(ACCESS_TOKEN_KEY);
      const storedUser = getCookie(USER_PROFILE_KEY);

      if (token && storedUser) {
        try {
          // Try verifying the token with the server
          const profile = await getMeApi(token);
          setUser(profile);
        } catch {
          // Token invalid – fall back to stored profile or clear
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            clearAuth();
          }
        }
      }

      setIsLoading(false);
    };

    hydrate();
  }, []);

  const clearAuth = useCallback(() => {
    removeCookie(ACCESS_TOKEN_KEY);
    removeCookie(REFRESH_TOKEN_KEY);
    removeCookie(USER_PROFILE_KEY);
    setUser(null);
  }, []);

  const login = useCallback(async (creds: LoginRequest) => {
    const res = await loginApi(creds);

    // Persist in cookies
    setCookie(ACCESS_TOKEN_KEY, res.accessToken, 1); // 1 day for access
    setCookie(REFRESH_TOKEN_KEY, res.refreshToken, 30); // 30 days for refresh
    setCookie(USER_PROFILE_KEY, JSON.stringify(res.user), 30);

    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
