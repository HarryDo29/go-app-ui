// ─── Axios Client ───────────────────────────────────────────────────────────
// Tạo axios instance dùng chung cho toàn bộ dự án.
//
// Tính năng:
//  • Tự động gắn Authorization header (request interceptor)
//  • Tự động refresh token khi gặp 401 (response interceptor)
//  • Timeout mặc định 30s
//  • Base URL lấy từ env
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { getCookie, setCookie, removeCookie } from "@/lib/cookies";

// ── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DEFAULT_TIMEOUT = 15_000; // 15 seconds

// ── Cookie keys ─────────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ── Axios instance ──────────────────────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ─────────────────────────────────────────────────────
// Tự động gắn Bearer token vào mỗi request (trừ khi có skipAuth)
axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const skipAuth = (config as InternalAxiosRequestConfig & { skipAuth?: boolean }).skipAuth;

  if (!skipAuth) {
    const token = getCookie(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      window.location.href = "/login";
    }
  }
  return config;
});

// ── Token refresh lock ──────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  failedQueue = [];
}

// ── Response interceptor ────────────────────────────────────────────────────
// Tự động refresh token khi gặp 401, queue các request song song
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("error: ", error);
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { skipAuth?: boolean; _retry?: boolean })
      | undefined;

    const responseData = error.response?.data as { code?: number } | undefined;
    const isTokenExpired = responseData?.code === 40103;

    if (isTokenExpired && originalRequest && !originalRequest._retry && !originalRequest.skipAuth) {
      // If isRefreshing = true -> add request to failedQueue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.set("Authorization", `Bearer ${token}`);
              resolve(axiosClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getCookie(REFRESH_TOKEN_KEY);
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = data.data?.accessToken;
        setCookie(ACCESS_TOKEN_KEY, newAccessToken, 1);

        // Xử lý các request đang chờ
        processQueue(null, newAccessToken);

        // Retry request gốc với token mới
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh thất bại → xóa auth, redirect login
        removeCookie(ACCESS_TOKEN_KEY);
        removeCookie(REFRESH_TOKEN_KEY);
        removeCookie("user_profile");
        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
