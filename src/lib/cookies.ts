// ─── Cookie Helpers ─────────────────────────────────────────────────────────
// Sử dụng universal-cookie (đi kèm react-cookie) để thao tác cookie
// ngoài React component tree (ví dụ: axios interceptors).
//
// Trong React components → dùng useCookies() từ react-cookie
// Ngoài React (axiosClient, utils...) → dùng file này
// ─────────────────────────────────────────────────────────────────────────────

import { Cookies } from "react-cookie";

const cookies = new Cookies();

export function getCookie(name: string): string | null {
  return cookies.get(name) ?? null;
}

export function setCookie(name: string, value: string, days = 7) {
  cookies.set(name, value, {
    path: "/",
    expires: new Date(Date.now() + days * 864e5),
    sameSite: "lax",
  });
}

export function removeCookie(name: string) {
  cookies.remove(name, { path: "/" });
}
