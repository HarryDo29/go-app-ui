import { User, UsersRound, Bell, Sun, Moon } from "lucide-react";
import type { TabKey } from "./types";
import { NavBtn } from "./ui-primitives";
import { SettingsDialog } from "./SettingsDialog";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

interface PrimarySidebarProps {
  tab: TabKey;
  showNotif: boolean;
  onTabChange: (tab: TabKey) => void;
  onToggleNotif: () => void;
}

export function PrimarySidebar({
  tab,
  showNotif,
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
    <aside className="w-16 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center py-4 gap-2">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-sm shadow-sm mb-2">
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
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-neutral-900 pointer-events-none" />
      </div>

      {/* Bottom controls */}
      <div className="mt-auto flex flex-col items-center gap-2">
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
            className="w-9 h-9 rounded-full object-cover mt-1 select-none border border-neutral-200 dark:border-neutral-800"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold mt-1 select-none shadow-sm shadow-primary/20">
            {initials}
          </div>
        )}
      </div>
    </aside>
  );
}
