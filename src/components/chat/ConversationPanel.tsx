import { useState } from "react";
import { Search, Plus, Check, UserPlus, MessageSquare, Bell, Users, Loader2 } from "lucide-react";
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

// ─── Notification List ────────────────────────────────────────────────────────
interface NotificationListProps {
  notifications: Notification[];
}

function NotificationList({ notifications }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center mb-3">
          <Bell size={24} className="text-neutral-300 dark:text-neutral-600" />
        </div>
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Không có thông báo
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
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
          className="px-3 py-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 cursor-pointer transition"
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-1.5 w-2 h-2 rounded-full shrink-0",
                n.unread ? "bg-primary" : "bg-transparent",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{n.title}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{n.desc}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{n.time}</p>
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
  const hasLastMsg = !!convo.lastMsg?.content;
  const lastText = hasLastMsg
    ? convo.lastMsg.content
    : tab === "friends"
      ? "Bắt đầu cuộc trò chuyện..."
      : "Hãy gửi tin nhắn đầu tiên...";
  const msgTime = convo.lastMsg?.created_at
    ? (() => {
        try {
          const d = new Date(convo.lastMsg.created_at);
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
          "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition",
          isActive
            ? "bg-primary/10 dark:bg-primary/15"
            : "hover:bg-neutral-100 dark:hover:bg-neutral-800/70",
        )}
      >
        <div className="relative shrink-0">
          <Avatar initials={initials} size="md" active={isActive} src={avatarUrl} />
          {/* {convo.online && <OnlineDot />} */}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate">{name}</span>
            <span className="text-[11px] text-neutral-400 shrink-0">{msgTime}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span
              className={cn(
                "text-xs truncate",
                hasLastMsg
                  ? "text-neutral-500 dark:text-neutral-400"
                  : "text-primary/80 dark:text-primary/70 italic font-medium",
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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center mb-3">
        {isGroups ? (
          <Users size={24} className="text-neutral-300 dark:text-neutral-600" />
        ) : (
          <MessageSquare size={24} className="text-neutral-300 dark:text-neutral-600" />
        )}
      </div>
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {isGroups ? "Chưa có nhóm nào" : "Chưa có cuộc trò chuyện"}
      </p>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
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
        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Có thể bạn quen
        </h5>
        <span className="text-[11px] text-neutral-400">{strangers.length}</span>
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
              className="px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition flex items-center gap-3"
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
                  "shrink-0 inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/40",
                  sent
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-default"
                    : "bg-primary hover:bg-primary/90 active:bg-primary/95 text-white",
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
  onSelectConvo: (id: string) => void;
  onSendRequest: (id: string) => void;
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
  onSelectConvo,
  onSendRequest,
  onCreateGroup,
}: ConversationPanelProps) {
  const title = showNotif ? "Thông báo" : tab === "groups" ? "Nhóm" : "Bạn bè";

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
    <section className="w-80 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
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
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-neutral-400 transition"
              />
            </div>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <button
                  aria-label="Tạo Group"
                  title="Tạo Group"
                  className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg bg-primary hover:bg-primary/90 active:bg-primary/95 text-white shadow-sm shadow-primary/20 transition focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <Plus size={18} />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px] flex flex-col max-h-[85vh] p-6 gap-0">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-xl font-semibold">Tạo nhóm mới</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500 dark:text-neutral-400">
                    Nhập tên và chọn thành viên để bắt đầu cuộc trò chuyện nhóm mới.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4 overflow-y-auto pr-1">
                  {/* Tên nhóm */}
                  <div className="grid gap-2">
                    <label
                      htmlFor="group-name"
                      className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      Tên nhóm <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="group-name"
                      placeholder="VD: Dự án Alpha..."
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="h-10 text-sm focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  {/* Tìm kiếm bạn bè */}
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
                        className="h-9 pl-9 text-xs focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  {/* Danh sách bạn bè */}
                  <div className="border border-neutral-100 dark:border-neutral-800 rounded-lg max-h-[220px] overflow-y-auto bg-neutral-50/50 dark:bg-neutral-900/30 p-1">
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
                                  "w-full flex items-center justify-between p-2 rounded-md transition text-left cursor-pointer",
                                  isChecked
                                    ? "bg-primary/5 dark:bg-primary/10"
                                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
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
                                    "w-4 h-4 rounded-full border flex items-center justify-center transition shrink-0",
                                    isChecked
                                      ? "border-primary bg-primary text-white"
                                      : "border-neutral-300 dark:border-neutral-700",
                                  )}
                                >
                                  {isChecked && <Check size={10} strokeWidth={3} />}
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                    className="h-10 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!groupName.trim() || isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-4 text-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {showNotif ? (
          <NotificationList notifications={[]} />
        ) : (
          <>
            {list.length === 0 ? (
              <EmptyConversationList tab={tab} />
            ) : (
              <ul className="space-y-0.5">
                {list.map((c) => (
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
