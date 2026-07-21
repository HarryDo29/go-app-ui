// ─── Auth API ───────────────────────────────────────────────────────────────
// Feature: Authentication (login, getMe, refresh, logout)
// ─────────────────────────────────────────────────────────────────────────────

import axiosClient from "./axiosClient";
import type { LoginRequest, LoginResponse, UserProfile } from "@/lib/auth-types";

// ── Login ───────────────────────────────────────────────────────────────────
export async function loginApi(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await axiosClient.post<{ data: LoginResponse }>("/auth/login", body, {
    skipAuth: true,
  } as any);
  return data.data;
}

// ── Logout ──────────────────────────────────────────────────────────────────
export async function logoutApi(refreshToken: string): Promise<any> {
  const { data } = await axiosClient.post("/auth/logout", { refresh_token: refreshToken });
  return data;
}

// ── Get current user ────────────────────────────────────────────────────────
export async function getMeApi(): Promise<UserProfile> {
  const { data } = await axiosClient.get<{ data: UserProfile }>("/user/me");
  return data.data;
}

// ── Refresh token ───────────────────────────────────────────────────────────
export async function refreshTokenApi(refreshToken: string): Promise<{ accessToken: string }> {
  const { data } = await axiosClient.post<{ data: { accessToken: string } }>("/auth/refresh", {
    refreshToken,
  });
  return data.data;
}

// ── Register ────────────────────────────────────────────────────────────────
export async function registerApi(body: any): Promise<any> {
  const { data } = await axiosClient.post("/auth/register", body, { skipAuth: true } as any);
  return data;
}

// ── Forget Password ─────────────────────────────────────────────────────────
export async function forgetPasswordApi(body: any): Promise<any> {
  const { data } = await axiosClient.post("/auth/forget", body, { skipAuth: true } as any);
  return data;
}

export async function verifyForgetOtpApi(body: any): Promise<any> {
  const { data } = await axiosClient.post("/auth/forget/verify", body, { skipAuth: true } as any);
  return data;
}

export async function resetPasswordApi(body: any, resetToken: string): Promise<any> {
  const { data } = await axiosClient.post("/auth/reset", body, {
    skipAuth: true,
    headers: { Authorization: `Bearer ${resetToken}` },
  } as any);
  return data;
}

// ── Private Auth (Requires Token) ───────────────────────────────────────────
export async function changePasswordApi(body: any): Promise<any> {
  const { data } = await axiosClient.post("/auth/change-password", body);
  return data;
}

export async function sendOtpApi(body: any): Promise<any> {
  const { data } = await axiosClient.post("/auth/otp", body);
  return data;
}

export async function verifyOtpApi(body: any): Promise<any> {
  const { data } = await axiosClient.post("/auth/otp/verify", body);
  return data;
}
