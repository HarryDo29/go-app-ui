import { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Volume2,
  VolumeX,
  BellOff,
  Sun,
  Moon,
  Monitor,
  Camera,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NavBtn } from "./ui-primitives";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsSection = "profile" | "notifications" | "appearance" | "privacy" | "language";

interface SettingsItem {
  id: SettingsSection;
  icon: React.ReactNode;
  label: string;
}

const SECTIONS: SettingsItem[] = [
  { id: "profile", icon: <User size={16} />, label: "Hồ sơ cá nhân" },
  { id: "notifications", icon: <Bell size={16} />, label: "Thông báo" },
  { id: "appearance", icon: <Palette size={16} />, label: "Giao diện" },
  { id: "privacy", icon: <Shield size={16} />, label: "Bảo mật & Quyền riêng tư" },
  { id: "language", icon: <Globe size={16} />, label: "Ngôn ngữ & Vùng" },
];

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Thông tin cá nhân
        </h3>
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xl font-bold">
              ME
            </div>
            <button className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
              <Camera size={16} className="text-white" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Người dùng của tôi
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Bấm vào avatar để thay đổi ảnh
            </p>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <label
              htmlFor="s-display-name"
              className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Tên hiển thị
            </label>
            <Input
              id="s-display-name"
              defaultValue="Người dùng"
              placeholder="Nhập tên của bạn..."
            />
          </div>
          <div className="grid gap-1.5">
            <label
              htmlFor="s-status"
              className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Trạng thái
            </label>
            <Input id="s-status" defaultValue="Đang hoạt động" placeholder="Đặt trạng thái..." />
          </div>
          <div className="grid gap-1.5">
            <label
              htmlFor="s-email"
              className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Email
            </label>
            <Input
              id="s-email"
              type="email"
              defaultValue="me@company.com"
              disabled
              className="opacity-60 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
      <Button className="bg-indigo-500 hover:bg-indigo-600 text-white w-full">Lưu thay đổi</Button>
    </div>
  );
}

// ─── Section: Notifications ───────────────────────────────────────────────────

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  defaultChecked?: boolean;
}

function ToggleRow({ icon, label, desc, defaultChecked = true }: ToggleRowProps) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <span className="text-neutral-500 dark:text-neutral-400">{icon}</span>
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
          {desc && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={setChecked}
        className="data-[state=checked]:bg-indigo-500"
      />
    </div>
  );
}

function NotificationsSection() {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        Cài đặt thông báo
      </h3>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        <ToggleRow
          icon={<Bell size={16} />}
          label="Thông báo đẩy"
          desc="Nhận thông báo ngay cả khi không mở app"
        />
        <ToggleRow
          icon={<Volume2 size={16} />}
          label="Âm thanh thông báo"
          desc="Phát âm thanh khi có tin nhắn mới"
        />
        <ToggleRow
          icon={<BellOff size={16} />}
          label="Chế độ không làm phiền"
          desc="Tắt tất cả thông báo"
          defaultChecked={false}
        />
        <ToggleRow
          icon={<VolumeX size={16} />}
          label="Tắt tiếng cuộc trò chuyện"
          desc="Tắt thông báo riêng lẻ"
          defaultChecked={false}
        />
      </div>
    </div>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────

interface ThemeOptionProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function ThemeOption({ icon, label, active, onClick }: ThemeOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition cursor-pointer w-full",
        active
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
          : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600",
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function AppearanceSection() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          Chủ đề
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <ThemeOption
            icon={<Sun size={20} />}
            label="Sáng"
            active={theme === "light"}
            onClick={() => setTheme("light")}
          />
          <ThemeOption
            icon={<Moon size={20} />}
            label="Tối"
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
          />
          <ThemeOption
            icon={<Monitor size={20} />}
            label="Hệ thống"
            active={theme === "system"}
            onClick={() => setTheme("system")}
          />
        </div>
      </div>

      {/* Font size */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          Cỡ chữ
        </h3>
        <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          {(["sm", "md", "lg"] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={cn(
                "flex-1 py-1.5 rounded-md text-xs font-medium transition cursor-pointer",
                fontSize === size
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300",
              )}
            >
              {size === "sm" ? "Nhỏ" : size === "md" ? "Vừa" : "Lớn"}
            </button>
          ))}
        </div>
      </div>

      {/* Compact mode */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        <ToggleRow
          icon={<Monitor size={16} />}
          label="Chế độ compact"
          desc="Hiển thị nhiều nội dung hơn trên màn hình"
          defaultChecked={false}
        />
      </div>
    </div>
  );
}

// ─── Section: Privacy ─────────────────────────────────────────────────────────

function PrivacySection() {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        Bảo mật & Quyền riêng tư
      </h3>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        <ToggleRow
          icon={<Shield size={16} />}
          label="Xác thực 2 bước"
          desc="Bảo vệ tài khoản thêm một lớp"
          defaultChecked={false}
        />
        <ToggleRow
          icon={<User size={16} />}
          label="Hiển thị trạng thái online"
          desc="Người khác có thể thấy bạn đang online"
        />
        <ToggleRow
          icon={<Bell size={16} />}
          label="Xác nhận đã đọc"
          desc="Gửi thông báo đã đọc cho người gửi"
        />
        <ToggleRow
          icon={<Shield size={16} />}
          label="Mã hoá đầu cuối"
          desc="Bật mặc định cho mọi cuộc trò chuyện"
        />
      </div>
      <div className="pt-4">
        <Button variant="destructive" size="sm" className="w-full">
          Đăng xuất khỏi tất cả thiết bị
        </Button>
      </div>
    </div>
  );
}

// ─── Section: Language ────────────────────────────────────────────────────────

function LanguageSection() {
  const [selected, setSelected] = useState("vi");

  const languages = [
    { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "한국어", flag: "🇰🇷" },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
        Ngôn ngữ hiển thị
      </h3>
      <ul className="space-y-1">
        {languages.map((lang) => (
          <li key={lang.code}>
            <button
              onClick={() => setSelected(lang.code)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition cursor-pointer",
                selected === lang.code
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
              )}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
              {selected === lang.code && (
                <span className="ml-auto text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                  Đang dùng
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main SettingsDialog ──────────────────────────────────────────────────────

export function SettingsDialog() {
  const [active, setActive] = useState<SettingsSection>("profile");

  const renderContent = () => {
    switch (active) {
      case "profile":
        return <ProfileSection />;
      case "notifications":
        return <NotificationsSection />;
      case "appearance":
        return <AppearanceSection />;
      case "privacy":
        return <PrivacySection />;
      case "language":
        return <LanguageSection />;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <span>
          <NavBtn icon={<Settings size={20} />} label="Cài đặt" />
        </span>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="flex h-[560px]">
          {/* ── Left nav ── */}
          <div className="w-52 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex flex-col">
            <DialogHeader className="px-4 pt-5 pb-4 shrink-0">
              <DialogTitle className="text-base font-semibold">Cài đặt</DialogTitle>
            </DialogHeader>
            <nav className="flex-1 px-2 pb-3 overflow-y-auto">
              <ul className="space-y-0.5">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setActive(s.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition cursor-pointer",
                        active === s.id
                          ? "bg-indigo-500 text-white font-medium"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800",
                      )}
                    >
                      {s.icon}
                      <span>{s.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            {/* App version */}
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
              <p className="text-[11px] text-neutral-400">Nova Chat v1.0.0</p>
            </div>
          </div>

          {/* ── Right content ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5">{renderContent()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
