import { Search, Plus, Check, UserPlus } from "lucide-react";
import type { TabKey, Conversation } from "./types";
import { notifications } from "./types";
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
function NotificationList() {
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
                n.unread ? "bg-indigo-500" : "bg-transparent",
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
  convo: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function ConvItem({ convo, isActive, onClick }: ConvItemProps) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition",
          isActive
            ? "bg-indigo-50 dark:bg-indigo-500/10"
            : "hover:bg-neutral-100 dark:hover:bg-neutral-800/70",
        )}
      >
        <div className="relative shrink-0">
          <Avatar initials={convo.avatar} size="md" active={isActive} />
          {convo.online && <OnlineDot />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate">{convo.name}</span>
            <span className="text-[11px] text-neutral-400 shrink-0">{convo.time}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {convo.last}
            </span>
            {convo.unread ? <UnreadBadge count={convo.unread} /> : null}
          </div>
        </div>
      </button>
    </li>
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
          const sent = sentRequests.has(s.id);
          return (
            <li
              key={s.id}
              className="px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition flex items-center gap-3"
            >
              <Avatar initials={s.avatar} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{s.last}</p>
              </div>
              <button
                onClick={() => onSendRequest(s.id)}
                disabled={sent}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
                  sent
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-default"
                    : "bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white",
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
  strangers: Conversation[];
  activeId: string;
  sentRequests: Set<string>;
  onSelectConvo: (id: string) => void;
  onSendRequest: (id: string) => void;
}

export function ConversationPanel({
  tab,
  showNotif,
  list,
  strangers,
  activeId,
  sentRequests,
  onSelectConvo,
  onSendRequest,
}: ConversationPanelProps) {
  const title = showNotif ? "Thông báo" : tab === "groups" ? "Nhóm" : "Bạn bè";

  return (
    <section className="w-80 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {!showNotif && (
          <div className="mt-3 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              placeholder="Tìm kiếm..."
              aria-label="Tìm kiếm cuộc trò chuyện"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 placeholder:text-neutral-400 transition"
            />
          </div>
        )}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {showNotif ? (
          <NotificationList />
        ) : (
          <>
            {tab === "groups" && (
              <Dialog>
                <DialogTrigger asChild>
                  <button className="mx-1 mb-2 mt-1 w-[calc(100%-0.5rem)] flex items-center justify-center gap-2 h-10 rounded-lg bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-medium shadow-sm shadow-indigo-500/20 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer">
                    <Plus size={16} />
                    <span>Tạo Group</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Tạo nhóm mới</DialogTitle>
                    <DialogDescription>
                      Nhập tên và chọn thành viên để bắt đầu cuộc trò chuyện nhóm mới.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label
                        htmlFor="group-name"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Tên nhóm
                      </label>
                      <Input id="group-name" placeholder="VD: Dự án Alpha..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white">
                      Tạo nhóm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <ul className="space-y-0.5">
              {list.map((c) => (
                <ConvItem
                  key={c.id}
                  convo={c}
                  isActive={c.id === activeId}
                  onClick={() => onSelectConvo(c.id)}
                />
              ))}
            </ul>

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
