import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

import type { UserProfile, LoginRequest } from "@/lib/auth-types";
import { loginApi, getMeApi, logoutApi } from "@/lib/api/auth";
import { useCookies } from "react-cookie";

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
  updateProfile: (updated: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUserProfile(rawUser: any): UserProfile | null {
  if (!rawUser) return null;
  return {
    id: rawUser.id || rawUser.user_id || "",
    user_name: rawUser.user_name || rawUser.username || "",
    email: rawUser.email || "",
    role: rawUser.role || "",
    is_active: rawUser.is_active ?? true,
    avatar_url: rawUser.avatar || rawUser.avatar_url || "",
  };
}

// ─── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [cookies, setCookie, removeCookie] = useCookies([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_PROFILE_KEY,
  ]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate session from cookies on mount
  useEffect(() => {
    const hydrate = async () => {
      const token = cookies[ACCESS_TOKEN_KEY];
      const storedUser = cookies[USER_PROFILE_KEY];

      if (token && storedUser) {
        try {
          // Try verifying the token with the server
          const profile = await getMeApi();
          console.log("profile: ", profile);
          const normalized = normalizeUserProfile(profile);
          setUser(normalized);
        } catch {
          // Token invalid – fall back to stored profile or clear
          try {
            const parsedUser = typeof storedUser === "string" ? JSON.parse(storedUser) : storedUser;
            setUser(normalizeUserProfile(parsedUser));
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
    removeCookie(ACCESS_TOKEN_KEY, { path: "/" });
    removeCookie(REFRESH_TOKEN_KEY, { path: "/" });
    removeCookie(USER_PROFILE_KEY, { path: "/" });
    setUser(null);
  }, [removeCookie]);

  const login = useCallback(
    async (creds: LoginRequest) => {
      const res = await loginApi(creds);
      console.log(res);

      const accessExpires = new Date(Date.now() + 1 * 864e5); // 1 day
      const refreshExpires = new Date(Date.now() + 30 * 864e5); // 30 days

      const normalizedUser = normalizeUserProfile(res.user);

      // Persist in cookies
      setCookie(ACCESS_TOKEN_KEY, res.access_token, {
        path: "/",
        expires: accessExpires,
        sameSite: "lax",
      });
      setCookie(REFRESH_TOKEN_KEY, res.refresh_token, {
        path: "/",
        expires: refreshExpires,
        sameSite: "lax",
      });
      setCookie(USER_PROFILE_KEY, normalizedUser, {
        path: "/",
        expires: refreshExpires,
        sameSite: "lax",
      });

      setUser(normalizedUser);
    },
    [setCookie],
  );

  const updateProfile = useCallback(
    (updatedUser: UserProfile) => {
      const refreshExpires = new Date(Date.now() + 30 * 864e5); // 30 days
      const normalizedUser = normalizeUserProfile(updatedUser);
      setCookie(USER_PROFILE_KEY, normalizedUser, {
        path: "/",
        expires: refreshExpires,
        sameSite: "lax",
      });
      setUser(normalizedUser);
    },
    [setCookie],
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = cookies[REFRESH_TOKEN_KEY];
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      clearAuth();
    }
  }, [cookies, clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
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
