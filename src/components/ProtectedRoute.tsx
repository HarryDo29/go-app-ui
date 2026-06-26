import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

// ─── Loading Spinner ────────────────────────────────────────────────────────
function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Đang xác thực...</p>
      </div>
    </div>
  );
}

// ─── Protected Route Wrapper ────────────────────────────────────────────────
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
