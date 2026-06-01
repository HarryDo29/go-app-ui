import { Users, UsersRound, Bell, Sun, Moon } from "lucide-react";
import type { TabKey } from "./types";
import { NavBtn } from "./ui-primitives";
import { SettingsDialog } from "./SettingsDialog";

interface PrimarySidebarProps {
  tab: TabKey;
  showNotif: boolean;
  dark: boolean;
  onTabChange: (tab: TabKey) => void;
  onToggleNotif: () => void;
  onToggleDark: () => void;
}

export function PrimarySidebar({
  tab,
  showNotif,
  dark,
  onTabChange,
  onToggleNotif,
  onToggleDark,
}: PrimarySidebarProps) {
  return (
    <aside className="w-16 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center py-4 gap-2">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm mb-2">
        N
      </div>

      <NavBtn
        icon={<Users size={20} />}
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
          icon={dark ? <Sun size={20} /> : <Moon size={20} />}
          label={dark ? "Chế độ sáng" : "Chế độ tối"}
          onClick={onToggleDark}
        />
        <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold mt-1 select-none">
          ME
        </div>
      </div>
    </aside>
  );
}
