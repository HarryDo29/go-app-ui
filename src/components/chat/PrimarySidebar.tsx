import { User, UsersRound, Bell, Sun, Moon } from "lucide-react";
import type { TabKey } from "./types";
import { NavBtn } from "./ui-primitives";
import { SettingsDialog } from "./SettingsDialog";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

interface PrimarySidebarProps {
  tab: TabKey;
  showNotif: boolean;
  pendingCount: number;
  onTabChange: (tab: TabKey) => void;
  onToggleNotif: () => void;
}

export function PrimarySidebar({
  tab,
  showNotif,
  pendingCount,
  onTabChange,
  onToggleNotif,
}: PrimarySidebarProps) {
  const { user } = useAuth();
  const { isDark, setTheme } = useTheme();

  const handleToggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const getInitials = (name: string) => {
    if (!name) return "ME";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = user ? getInitials(user.user_name) : "ME";

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden sm:flex w-[68px] shrink-0 border-r border-neutral-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl flex-col items-center py-4 gap-1.5">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/25 mb-3 glow-primary">
          N
        </div>

        <NavBtn
          icon={<User size={20} />}
          label="Bạn bè"
          active={tab === "friends" && !showNotif}
          onClick={() => onTabChange("friends")}
        />
        <NavBtn
          icon={<UsersRound size={20} />}
          label="Nhóm"
          active={tab === "groups" && !showNotif}
          onClick={() => onTabChange("groups")}
        />

        {/* Notification bell with badge */}
        <div className="relative">
          <NavBtn
            icon={<Bell size={20} />}
            label="Thông báo"
            active={showNotif}
            onClick={onToggleNotif}
          />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 ring-2 ring-white dark:ring-neutral-900 text-white text-[10px] font-bold flex items-center justify-center px-1 pointer-events-none shadow-sm shadow-rose-500/30">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </div>

        {/* Bottom controls */}
        <div className="mt-auto flex flex-col items-center gap-1.5">
          {/* Settings — opens the Settings Dialog */}
          <SettingsDialog />

          <NavBtn
            icon={isDark ? <Sun size={20} /> : <Moon size={20} />}
            label={isDark ? "Chế độ sáng" : "Chế độ tối"}
            onClick={handleToggleTheme}
          />

          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.user_name}
              className="w-9 h-9 rounded-full object-cover mt-1.5 select-none ring-2 ring-neutral-200/50 dark:ring-white/[0.08] hover:ring-primary/40 transition-all duration-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center text-xs font-semibold mt-1.5 select-none shadow-md shadow-primary/20 ring-2 ring-primary/20">
              {initials}
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ───────────────────────────────────────────── */}
      <nav className="sm:hidden mobile-bottom-nav">
        <button
          onClick={() => onTabChange("friends")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
            tab === "friends" && !showNotif
              ? "text-primary"
              : "text-neutral-400 dark:text-neutral-500"
          }`}
        >
          <User size={20} />
          <span className="text-[10px] font-medium">Bạn bè</span>
        </button>

        <button
          onClick={() => onTabChange("groups")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
            tab === "groups" && !showNotif
              ? "text-primary"
              : "text-neutral-400 dark:text-neutral-500"
          }`}
        >
          <UsersRound size={20} />
          <span className="text-[10px] font-medium">Nhóm</span>
        </button>

        <div className="relative">
          <button
            onClick={onToggleNotif}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
              showNotif ? "text-primary" : "text-neutral-400 dark:text-neutral-500"
            }`}
          >
            <Bell size={20} />
            <span className="text-[10px] font-medium">Thông báo</span>
          </button>
          {pendingCount > 0 && (
            <span className="absolute top-0 right-1 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-1 pointer-events-none">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </div>

        <button
          onClick={handleToggleTheme}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-neutral-400 dark:text-neutral-500 transition-all duration-200 min-w-[56px]"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-[10px] font-medium">{isDark ? "Sáng" : "Tối"}</span>
        </button>
      </nav>
    </>
  );
}
