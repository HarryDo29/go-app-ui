// ─── Fetch Client ───────────────────────────────────────────────────────────
// HTTP wrapper dùng chung cho toàn bộ dự án.
//
// Khi có backend Go, chỉ cần đổi BASE_URL và bỏ mock trong từng file feature.
//
// Tính năng:
//  • Tự động gắn Authorization header từ cookie
//  • Tự động parse JSON response
//  • Xử lý lỗi HTTP thống nhất (throw ApiError)
//  • Hỗ trợ refresh token khi 401
//  • Timeout mặc định 30s
// ─────────────────────────────────────────────────────────────────────────────

import { getCookie, setCookie, removeCookie } from "@/lib/cookies";

// ── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const DEFAULT_TIMEOUT = 30_000; // 30 seconds

// ── Cookie keys (shared with auth-context) ──────────────────────────────────
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ── Custom error ────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

// ── Types ───────────────────────────────────────────────────────────────────
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  /** Skip automatic Authorization header (e.g. for login) */
  skipAuth?: boolean;
  /** Custom timeout in ms */
  timeout?: number;
  /** Query params appended to the URL */
  params?: Record<string, string | number | boolean | undefined>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(
    path.startsWith("http") ? path : `${BASE_URL}${path}`,
    window.location.origin,
  );

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }

  return url.toString();
}

function buildHeaders(options: RequestOptions, hasBody: boolean): Headers {
  const headers = new Headers(options.headers);

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const token = getCookie(ACCESS_TOKEN_KEY);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return headers;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  // Non-JSON responses (e.g. plain text, empty body)
  const text = await res.text();
  return text as unknown as T;
}

// ── Token refresh lock (prevents parallel refresh calls) ────────────────────
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getCookie(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    try {
      const res = await fetch(buildUrl("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = (await res.json()) as { accessToken: string };
      setCookie(ACCESS_TOKEN_KEY, data.accessToken, 1);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Core request ────────────────────────────────────────────────────────────

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, skipAuth, params, ...fetchOpts } = options;
  const url = buildUrl(path, params);
  const hasBody = body !== undefined;
  const headers = buildHeaders({ skipAuth, headers: fetchOpts.headers }, hasBody);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    let res = await fetch(url, {
      ...fetchOpts,
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    // ── 401 → try refresh once ──────────────────────────────────────
    if (res.status === 401 && !skipAuth) {
      const refreshed = await tryRefreshToken();

      if (refreshed) {
        // Retry original request with new token
        const retryHeaders = buildHeaders({ skipAuth: false, headers: fetchOpts.headers }, hasBody);

        res = await fetch(url, {
          ...fetchOpts,
          method,
          headers: retryHeaders,
          body: hasBody ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
      } else {
        // Refresh failed → clear auth, redirect to login
        removeCookie(ACCESS_TOKEN_KEY);
        removeCookie(REFRESH_TOKEN_KEY);
        removeCookie("user_profile");
        window.location.href = "/login";
        throw new ApiError(401, "Unauthorized", null);
      }
    }

    if (!res.ok) {
      const errorBody = await parseResponse<unknown>(res);
      throw new ApiError(res.status, res.statusText, errorBody);
    }

    return await parseResponse<T>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(0, "Request timeout", null);
    }

    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, options?: RequestOptions) {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>("POST", path, body, options);
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>("PUT", path, body, options);
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>("PATCH", path, body, options);
  },

  delete<T>(path: string, options?: RequestOptions) {
    return request<T>("DELETE", path, undefined, options);
  },
} as const;
