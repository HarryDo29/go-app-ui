import { useState, useEffect } from "react";
import { searchUsersApi } from "@/lib/api/users";
import {
  Check,
  CheckCheck,
  X,
  UserPlus,
  MessageSquare,
  Bell,
  Users,
  Loader2,
  Search,
  Plus,
  ArrowLeft,
} from "lucide-react";
import type { TabKey, Conversation, Notification } from "./types";
import { Avatar, OnlineDot, UnreadBadge } from "./ui-primitives";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ─── Pending Connection Item type ─────────────────────────────────────────────
export interface PendingConnection {
  connection_id: string;
  requester_id: string;
  user_name: string;
  email: string;
  avatar_url?: string;
}

// ─── Pending Connections List ─────────────────────────────────────────────────
interface PendingConnectionListProps {
  pending: PendingConnection[];
  onAccept: (connectionId: string) => void;
  onReject: (connectionId: string) => void;
}

function PendingConnectionList({ pending, onAccept, onReject }: PendingConnectionListProps) {
  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
          <Bell size={28} className="text-neutral-300 dark:text-neutral-600" />
        </div>
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          Không có lời mời kết bạn
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 max-w-[200px]">
          Các lời mời kết bạn mới sẽ hiển thị ở đây
        </p>
      </div>
    );
  }

  return (
    <div className="px-2 pb-3">
      <p className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        Lời mời kết bạn ({pending.length})
      </p>
      <ul className="space-y-1.5">
        {pending.map((conn) => {
          const initials = conn.user_name ? conn.user_name.substring(0, 2).toUpperCase() : "?";
          return (
            <li
              key={conn.connection_id}
              className="px-3 py-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-100 dark:border-white/[0.06] hover-lift"
            >
              <div className="flex items-center gap-3">
                <Avatar initials={initials} size="md" src={conn.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{conn.user_name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {conn.email}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onAccept(conn.connection_id)}
                  className="flex-1 h-9 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20"
                >
                  <CheckCheck size={13} /> Chấp nhận
                </button>
                <button
                  onClick={() => onReject(conn.connection_id)}
                  className="flex-1 h-9 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-white/[0.1] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <X size={13} /> Từ chối
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Notification List ────────────────────────────────────────────────────────
interface NotificationListProps {
  notifications: Notification[];
}

function NotificationList({ notifications }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
          <Bell size={28} className="text-neutral-300 dark:text-neutral-600" />
        </div>
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          Không có thông báo
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
          Các thông báo mới sẽ hiển thị ở đây
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {notifications.map((n) => (
        <li
          key={n.id}
          className="px-3 py-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.04] cursor-pointer transition-all duration-200"
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-1.5 w-2 h-2 rounded-full shrink-0 transition-colors",
                n.unread ? "bg-primary shadow-sm shadow-primary/30" : "bg-transparent",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{n.title}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{n.desc}</p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">{n.time}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Conversation Item ────────────────────────────────────────────────────────
interface ConvItemProps {
  tab: TabKey;
  convo: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function ConvItem({ tab, convo, isActive, onClick }: ConvItemProps) {
  const name = tab === "friends" ? convo.subject?.user_name : convo.group?.group_name;
  const avatarUrl = tab === "friends" ? convo.subject?.avatar_url : convo.group?.avatar_url;
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "";
  const hasLastMsg = !!convo.last_msg?.content;
  const lastText = hasLastMsg
    ? convo.last_msg.content
    : tab === "friends"
      ? "Bắt đầu cuộc trò chuyện..."
      : "Hãy gửi tin nhắn đầu tiên...";
  const msgTime = convo.last_msg?.created_at
    ? (() => {
        try {
          const d = new Date(convo.last_msg.created_at);
          return isNaN(d.getTime())
            ? ""
            : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        } catch {
          return "";
        }
      })()
    : "";

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 transition-all duration-200",
          isActive
            ? "bg-primary/8 dark:bg-primary/12 ring-1 ring-primary/15 dark:ring-primary/20"
            : "hover:bg-neutral-100/80 dark:hover:bg-white/[0.04] active:scale-[0.99]",
        )}
      >
        <div className="relative shrink-0">
          <Avatar initials={initials} size="md" active={isActive} src={avatarUrl} />
          {/* {convo.online && <OnlineDot />} */}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-sm font-semibold truncate",
                isActive && "text-primary dark:text-primary",
              )}
            >
              {name}
            </span>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0 font-medium">
              {msgTime}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span
              className={cn(
                "text-xs truncate",
                hasLastMsg
                  ? "text-neutral-500 dark:text-neutral-400"
                  : "text-primary/60 dark:text-primary/50 italic font-medium",
              )}
            >
              {lastText}
            </span>
            {/* {convo.unread ? <UnreadBadge count={convo.unread} /> : null} */}
          </div>
        </div>
      </button>
    </li>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyConversationList({ tab }: { tab: TabKey }) {
  const isGroups = tab === "groups";
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
        {isGroups ? (
          <Users size={28} className="text-neutral-300 dark:text-neutral-600" />
        ) : (
          <MessageSquare size={28} className="text-neutral-300 dark:text-neutral-600" />
        )}
      </div>
      <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
        {isGroups ? "Chưa có nhóm nào" : "Chưa có cuộc trò chuyện"}
      </p>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 max-w-[220px]">
        {isGroups
          ? "Tạo nhóm mới để bắt đầu trò chuyện cùng nhau"
          : "Kết bạn để bắt đầu trò chuyện"}
      </p>
    </div>
  );
}

// ─── Strangers Section ────────────────────────────────────────────────────────
interface StrangersSectionProps {
  strangers: Conversation[];
  sentRequests: Set<string>;
  onSendRequest: (id: string) => void;
}

function StrangersSection({ strangers, sentRequests, onSendRequest }: StrangersSectionProps) {
  if (strangers.length === 0) return null;

  return (
    <div className="mt-4 px-1">
      <div className="px-3 mb-2 flex items-center justify-between">
        <h5 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          Có thể bạn quen
        </h5>
        <span className="text-[11px] text-neutral-400 font-medium">{strangers.length}</span>
      </div>
      <ul className="space-y-0.5">
        {strangers.map((s) => {
          const sent = sentRequests.has(s.channel_id);
          const name = s.subject?.user_name ?? "";
          const initials = name
            ? name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()
            : "";
          const email = s.subject?.email ?? "";
          return (
            <li
              key={s.channel_id}
              className="px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.04] transition-all duration-200 flex items-center gap-3"
            >
              <Avatar initials={initials} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{email}</p>
              </div>
              <button
                onClick={() => onSendRequest(s.channel_id)}
                disabled={sent}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30",
                  sent
                    ? "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 cursor-default"
                    : "bg-primary hover:bg-primary/90 active:scale-[0.97] text-white shadow-sm shadow-primary/20",
                )}
              >
                {sent ? (
                  <>
                    <Check size={13} />
                    Đã gửi
                  </>
                ) : (
                  <>
                    <UserPlus size={13} /> Kết bạn
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── ConversationPanel ────────────────────────────────────────────────────────
interface ConversationPanelProps {
  tab: TabKey;
  showNotif: boolean;
  list: Conversation[];
  friendsList?: Conversation[];
  strangers: Conversation[];
  activeId: string | null;
  sentRequests: Set<string>;
  pendingConnections: PendingConnection[];
  onSelectConvo: (id: string) => void;
  onSendRequest: (id: string) => void;
  onAcceptConnection: (connectionId: string) => void;
  onRejectConnection: (connectionId: string) => void;
  onCreateGroup?: (groupName: string, selectedUserIds: string[]) => Promise<void>;
}

export function ConversationPanel({
  tab,
  showNotif,
  list,
  friendsList = [],
  strangers,
  activeId,
  sentRequests,
  pendingConnections,
  onSelectConvo,
  onSendRequest,
  onAcceptConnection,
  onRejectConnection,
  onCreateGroup,
}: ConversationPanelProps) {
  const title = showNotif ? "Thông báo" : tab === "groups" ? "Nhóm" : "Bạn bè";

  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (globalSearchQuery.trim()) {
        setIsSearchingGlobal(true);
        try {
          console.log("name: ", globalSearchQuery);

          const res = await searchUsersApi(globalSearchQuery);
          console.log("find users: ", res);

          setGlobalSearchResults(res.data == null ? [] : res.data);
          setShowGlobalDropdown(true);
        } catch (err) {
          console.error("Search error:", err);
          setGlobalSearchResults([]);
        } finally {
          setIsSearchingGlobal(false);
        }
      } else {
        setGlobalSearchResults([]);
        setShowGlobalDropdown(false);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [globalSearchQuery]);

  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setGroupName("");
      setSelectedUserIds([]);
      setSearchQuery("");
      setIsSubmitting(false);
    }
  };

  const filteredFriends = friendsList.filter((friend) => {
    const name = friend.subject?.user_name || "";
    const email = friend.subject?.email || "";
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSubmit = async () => {
    if (!groupName.trim() || !onCreateGroup) return;
    setIsSubmitting(true);
    try {
      await onCreateGroup(groupName.trim(), selectedUserIds);
      handleOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className={cn(
        "shrink-0 border-r border-neutral-200/80 dark:border-white/[0.06] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl flex flex-col",
        // Mobile: full width when no active chat, hidden when chat is active
        "w-full sm:w-80",
        activeId && "hidden sm:flex",
      )}
    >
      {/* Header */}
      <div className="px-4 sm:px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-lg font-bold tracking-tight">{title}</h1>
        </div>
        {!showNotif && (
          <div className="mt-3 flex gap-2 items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                placeholder="Tìm kiếm..."
                aria-label="Tìm kiếm cuộc trò chuyện"
                className="w-full h-10 sm:h-9 pl-9 pr-3 rounded-xl bg-neutral-100/80 dark:bg-white/[0.05] text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white dark:focus:bg-white/[0.08] placeholder:text-neutral-400 transition-all duration-200 border border-transparent focus:border-primary/20"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                onFocus={() => {
                  if (globalSearchQuery.trim()) setShowGlobalDropdown(true);
                }}
                onBlur={() => setTimeout(() => setShowGlobalDropdown(false), 200)}
              />

              {showGlobalDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-white/[0.08] rounded-xl shadow-xl shadow-neutral-900/5 dark:shadow-black/20 overflow-hidden z-50">
                  {isSearchingGlobal ? (
                    <div className="flex justify-center items-center py-5 text-neutral-500">
                      <Loader2 size={18} className="animate-spin" />
                    </div>
                  ) : globalSearchResults.length > 0 ? (
                    <ul className="max-h-60 overflow-y-auto">
                      {globalSearchResults.map((user) => {
                        const initials = user.user_name
                          ? user.user_name.substring(0, 2).toUpperCase()
                          : "";
                        return (
                          <li
                            key={user.user_id}
                            className="px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-white/[0.04] transition-all duration-150 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar initials={initials} size="sm" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{user.user_name}</p>
                                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                              </div>
                            </div>
                            {user.relation_status === "NONE" && !sentRequests.has(user.user_id) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSendRequest(user.user_id);
                                }}
                                className="shrink-0 p-2 rounded-lg bg-primary text-white hover:bg-primary/90 active:scale-95 transition-all duration-200 shadow-sm shadow-primary/20"
                                title="Kết bạn"
                              >
                                <UserPlus size={14} />
                              </button>
                            ) : (
                              <span className="text-[11px] text-primary font-semibold px-2 py-1 rounded-lg bg-primary/8 dark:bg-primary/15">
                                {sentRequests.has(user.user_id) ? "PENDING" : user.relation_status}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="py-5 text-center text-sm text-neutral-500">
                      Không tìm thấy kết quả.
                    </div>
                  )}
                </div>
              )}
            </div>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <button
                  aria-label="Tạo Group"
                  title="Tạo Group"
                  className="h-10 w-10 sm:h-9 sm:w-9 shrink-0 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/90 active:scale-95 text-white shadow-md shadow-primary/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <Plus size={18} />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px] flex flex-col max-h-[85vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4">
                  <DialogTitle className="text-xl font-bold">Tạo nhóm mới</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500 dark:text-neutral-400">
                    Nhập tên và chọn thành viên để bắt đầu cuộc trò chuyện nhóm mới.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 px-6 pb-4 overflow-y-auto">
                  {/* Tên nhóm */}
                  <div className="grid gap-2">
                    <label
                      htmlFor="group-name"
                      className="text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                    >
                      Tên nhóm <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="group-name"
                      placeholder="VD: Dự án Alpha..."
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="h-10 text-sm focus:ring-2 focus:ring-primary/30 rounded-xl"
                    />
                  </div>
                  {/* Tìm kiếm bạn bè */}
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Chọn thành viên (Đã chọn: {selectedUserIds.length})
                    </label>
                    <div className="relative">
                      <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                      />
                      <Input
                        placeholder="Tìm theo tên bạn bè..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 text-xs focus:ring-2 focus:ring-primary/30 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Danh sách bạn bè */}
                  <div className="border border-neutral-100 dark:border-white/[0.06] rounded-xl max-h-[220px] overflow-y-auto bg-neutral-50/50 dark:bg-white/[0.02] p-1.5">
                    {filteredFriends.length === 0 ? (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-8">
                        {searchQuery
                          ? "Không tìm thấy bạn bè nào phù hợp"
                          : "Chưa có bạn bè để thêm"}
                      </p>
                    ) : (
                      <ul className="space-y-0.5">
                        {filteredFriends.map((friend) => {
                          const friendUser = friend.subject;
                          if (!friendUser) return null;
                          const isChecked = selectedUserIds.includes(friendUser.user_id);
                          const initials = friendUser.user_name
                            ? friendUser.user_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()
                            : "";
                          return (
                            <li key={friend.channel_id}>
                              <button
                                type="button"
                                onClick={() => handleToggleUser(friendUser.user_id)}
                                className={cn(
                                  "w-full flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 text-left cursor-pointer",
                                  isChecked
                                    ? "bg-primary/6 dark:bg-primary/10 ring-1 ring-primary/15"
                                    : "hover:bg-neutral-100 dark:hover:bg-white/[0.04]",
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Avatar
                                    initials={initials}
                                    size="sm"
                                    src={friendUser.avatar_url}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                                      {friendUser.user_name}
                                    </p>
                                    <p className="text-[10px] text-neutral-400 truncate">
                                      {friendUser.email}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0",
                                    isChecked
                                      ? "border-primary bg-primary text-white scale-110"
                                      : "border-neutral-300 dark:border-neutral-600",
                                  )}
                                >
                                  {isChecked && <Check size={11} strokeWidth={3} />}
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-neutral-100 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-white/[0.02]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                    className="h-10 text-sm rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!groupName.trim() || isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 text-sm rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm shadow-primary/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      "Tạo nhóm"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-2 pb-20 sm:pb-3">
        {showNotif ? (
          <PendingConnectionList
            pending={pendingConnections}
            onAccept={onAcceptConnection}
            onReject={onRejectConnection}
          />
        ) : (
          <>
            {list.length === 0 ? (
              <EmptyConversationList tab={tab} />
            ) : (
              <ul className="space-y-0.5">
                {[...list]
                  .sort(
                    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
                  )
                  .map((c) => (
                    <ConvItem
                      tab={tab}
                      key={c.channel_id}
                      convo={c}
                      isActive={c.channel_id === activeId}
                      onClick={() => onSelectConvo(c.channel_id)}
                    />
                  ))}
              </ul>
            )}

            {tab === "friends" && (
              <StrangersSection
                strangers={strangers}
                sentRequests={sentRequests}
                onSendRequest={onSendRequest}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
