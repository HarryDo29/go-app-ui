import { useEffect, useState, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
  Trash2,
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
import { useAuth } from "@/lib/auth-context";
import { useTheme, type AccentColor } from "@/lib/theme-context";
import { updateUserApi, deleteUserApi } from "@/lib/api/users";
import { changePasswordApi } from "@/lib/api/auth";
import { generatePresignedUrlApi } from "@/lib/api/upload";
import axios from "axios";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsSection = "profile" | "notifications" | "appearance" | "privacy" | "language";

interface SettingsItem {
  id: SettingsSection;
  icon: React.ReactNode;
  label: string;
}

const SECTIONS: SettingsItem[] = [
  { id: "profile", icon: <User size={16} />, label: "Hồ sơ cá nhân" },
  { id: "privacy", icon: <Shield size={16} />, label: "Bảo mật" },
  { id: "notifications", icon: <Bell size={16} />, label: "Thông báo" },
  { id: "appearance", icon: <Palette size={16} />, label: "Giao diện" },
  { id: "language", icon: <Globe size={16} />, label: "Ngôn ngữ & Vùng" },
];

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_name || "");
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      // 1. Lấy presigned URL từ backend
      const ext = file.name.split(".").pop();
      const objectName = `avatar_${user.id}_${Date.now()}.${ext}`;

      const presignedRes = await generatePresignedUrlApi({
        object_name: objectName,
        content_type: file.type,
        folder: "avatars",
      });

      const uploadUrl = presignedRes.data?.url;
      if (!uploadUrl) {
        throw new Error("Không lấy được link upload từ server");
      }

      // 2. Upload file trực tiếp lên MinIO qua link presigned
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      // 3. Cập nhật URL avatar mới trong DB của user
      const cleanUrl = uploadUrl.split("?")[0];
      const updatedData = await updateUserApi(user.id, { avatar_url: cleanUrl });
      const updatedUser = updatedData?.data || updatedData;

      if (updatedUser) {
        updateProfile(updatedUser);
        toast.success("Thay đổi ảnh đại diện thành công!");
      }
    } catch (err: any) {
      console.error("Lỗi thay đổi avatar:", err);
      toast.error(err?.message || "Không thể thay đổi ảnh đại diện");
    } finally {
      setIsUploadingAvatar(false);
      // Reset value của input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      toast.error("Tên hiển thị không được để trống");
      return;
    }
    setIsSaving(true);
    try {
      const updatedData = await updateUserApi(user.id, { user_name: displayName });
      const updatedUser = updatedData?.data || updatedData;
      if (updatedUser && (updatedUser.id || updatedUser.user_id)) {
        updateProfile(updatedUser);
      } else {
        updateProfile({ ...user, user_name: displayName });
      }
      toast.success("Cập nhật thông tin thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Không thể cập nhật thông tin");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "ME";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = user ? getInitials(user.user_name) : "ME";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Thông tin cá nhân
        </h3>
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div
            onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
            className="relative group cursor-pointer"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            {isUploadingAvatar ? (
              <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin flex items-center justify-center bg-neutral-100 dark:bg-neutral-800" />
            ) : user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.user_name}
                className="w-16 h-16 rounded-full object-cover border border-neutral-200 dark:border-neutral-800"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
            )}
            {!isUploadingAvatar && (
              <button
                type="button"
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                <Camera size={16} className="text-white" />
              </button>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {user?.user_name || "Người dùng"}
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
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên của bạn..."
            />
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
              value={user?.email || ""}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
      <Button
        className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
      {/* Xóa tài khoản */}
      <div className="mt-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
        <div className="flex items-start gap-3">
          <Trash2 size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Xóa tài khoản</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/60 mt-0.5">
              Hành động này không thể hoàn tác. Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn.
            </p>
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                size="sm"
                className="mt-3 h-8 text-xs"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Xóa tài khoản
              </Button>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!user) return;
                    setIsDeleting(true);
                    try {
                      await deleteUserApi(user.id);
                      toast.success("Tài khoản đã được xóa");
                      window.location.href = "/login";
                    } catch (err: any) {
                      toast.error(err?.message || "Không thể xóa tài khoản");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Hủy
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
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
        className="data-[state=checked]:bg-primary"
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
          ? "border-primary bg-primary/10 dark:bg-primary/15 text-primary"
          : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600",
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function AppearanceSection() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");

  const accents: { id: AccentColor; name: string; colorClass: string }[] = [
    { id: "indigo", name: "Indigo", colorClass: "bg-indigo-500" },
    { id: "blue", name: "Blue", colorClass: "bg-blue-500" },
    { id: "emerald", name: "Emerald", colorClass: "bg-emerald-500" },
    { id: "rose", name: "Rose", colorClass: "bg-rose-500" },
    { id: "amber", name: "Amber", colorClass: "bg-amber-500" },
  ];

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

      {/* Accent Color */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          Màu chủ đạo
        </h3>
        <div className="flex items-center gap-3">
          {accents.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setAccentColor(acc.id)}
              title={acc.name}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition transform hover:scale-110",
                acc.colorClass,
                accentColor === acc.id
                  ? "ring-2 ring-offset-2 ring-neutral-900 dark:ring-offset-neutral-900 dark:ring-white scale-110"
                  : "opacity-80 hover:opacity-100",
              )}
            >
              {accentColor === acc.id && <span className="w-2 h-2 rounded-full bg-white" />}
            </button>
          ))}
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
  const { logout } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải dài tối thiểu 6 ký tự");
      return;
    }

    setIsChanging(true);
    try {
      await changePasswordApi({
        old_password: oldPassword,
        new_password: newPassword,
        conf_password: confirmPassword,
      });
      toast.success("Thay đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsFormOpen(false); // Optionally close form on success
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Không thể đổi mật khẩu, vui lòng kiểm tra lại mật khẩu cũ");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy settings */}
      <div>
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
      </div>

      {/* Change password form */}
      <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full flex items-center justify-between py-2 text-left font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer hover:opacity-85 transition-opacity"
        >
          <span className="text-sm">Đổi mật khẩu</span>
          {isFormOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isFormOpen && (
          <form
            onSubmit={handlePasswordChange}
            className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <div className="grid gap-1.5">
              <label
                htmlFor="s-old-password"
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                Mật khẩu hiện tại
              </label>
              <Input
                id="s-old-password"
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="s-new-password"
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                Mật khẩu mới
              </label>
              <Input
                id="s-new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="s-confirm-password"
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                Xác nhận mật khẩu mới
              </label>
              <Input
                id="s-confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={isChanging}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
            >
              {isChanging ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
          </form>
        )}
      </div>

      {/* Logout button */}
      <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
        <Button variant="destructive" size="sm" className="w-full" onClick={logout}>
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
                  ? "bg-primary/10 dark:bg-primary/15 text-primary font-medium"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
              )}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
              {selected === lang.code && (
                <span className="ml-auto text-xs bg-primary text-white px-1.5 py-0.5 rounded-full">
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

      <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="flex h-[80vh] sm:h-[560px]">
          {/* ── Left nav ── */}
          <div className="w-14 sm:w-52 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex flex-col">
            <DialogHeader className="px-3 sm:px-4 pt-5 pb-4 shrink-0">
              <DialogTitle className="text-sm sm:text-base font-bold text-center sm:text-left">
                <span className="hidden sm:inline">Cài đặt</span>
                <span className="sm:hidden">⚙️</span>
              </DialogTitle>
            </DialogHeader>
            <nav className="flex-1 px-1 sm:px-2 pb-3 overflow-y-auto">
              <ul className="space-y-0.5">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setActive(s.id)}
                      className={cn(
                        "w-full flex items-center justify-center sm:justify-start gap-2.5 px-3 py-2.5 sm:py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer",
                        active === s.id
                          ? "bg-primary text-white font-medium shadow-sm shadow-primary/20"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-850",
                      )}
                      title={s.label}
                    >
                      {s.icon}
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            {/* App version */}
            <div className="px-3 sm:px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 shrink-0 text-center sm:text-left">
              <p className="text-[10px] text-neutral-400">v1.0</p>
            </div>
          </div>

          {/* ── Right content ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">{renderContent()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
