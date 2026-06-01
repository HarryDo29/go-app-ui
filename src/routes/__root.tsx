import { createRootRouteWithContext, Outlet, Link } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

// ─── Not Found ─────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="text-center">
        <p className="text-indigo-500 font-semibold text-sm tracking-widest uppercase mb-4">404</p>
        <h1 className="text-5xl font-bold text-neutral-900 dark:text-neutral-100">
          Trang không tìm thấy
        </h1>
        <p className="mt-4 text-neutral-500 dark:text-neutral-400 text-sm">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 active:bg-indigo-700 transition"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

// ─── Root Route ─────────────────────────────────────────────────────────────
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => <Outlet />,
  notFoundComponent: NotFound,
});
