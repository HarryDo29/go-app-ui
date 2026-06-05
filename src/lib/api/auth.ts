// ─── Auth API ───────────────────────────────────────────────────────────────
// Feature: Authentication (login, getMe, refresh, logout)
//
// 🔧 Hiện tại: mock — chấp nhận bất kỳ email nào với password "123456".
// 🚀 Khi có backend: bỏ block mock, dùng `api` từ fetch-client.
//    Ví dụ:  return api.post<LoginResponse>("/auth/login", body, { skipAuth: true });
// ─────────────────────────────────────────────────────────────────────────────

// import { api } from "./fetch-client";   // ← uncomment khi có backend
import type { LoginRequest, LoginResponse, UserProfile } from "@/lib/auth-types";

const MOCK_DELAY = 800;

const MOCK_USER: UserProfile = {
  id: "u-1",
  name: "Harry Do",
  email: "harry@example.com",
  avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Harry",
};

// ── Login ───────────────────────────────────────────────────────────────────

export async function loginApi(body: LoginRequest): Promise<LoginResponse> {
  // 🚀 Real:  return api.post<LoginResponse>("/auth/login", body, { skipAuth: true });

  await new Promise((r) => setTimeout(r, MOCK_DELAY));

  if (!body.email || !body.password) {
    throw new Error("Email và mật khẩu không được để trống");
  }
  if (body.password !== "123456") {
    throw new Error("Email hoặc mật khẩu không đúng");
  }

  return {
    user: { ...MOCK_USER, email: body.email },
    accessToken: `mock-access-${Date.now()}`,
    refreshToken: `mock-refresh-${Date.now()}`,
  };
}

// ── Get current user ────────────────────────────────────────────────────────

export async function getMeApi(_accessToken: string): Promise<UserProfile> {
  // 🚀 Real:  return api.get<UserProfile>("/auth/me");

  await new Promise((r) => setTimeout(r, MOCK_DELAY / 2));
  return { ...MOCK_USER };
}

// ── Refresh token ───────────────────────────────────────────────────────────

export async function refreshTokenApi(_refreshToken: string): Promise<{ accessToken: string }> {
  // 🚀 Real:  return api.post<{ accessToken: string }>("/auth/refresh", { refreshToken });

  await new Promise((r) => setTimeout(r, MOCK_DELAY / 2));
  return { accessToken: `mock-access-${Date.now()}` };
}
