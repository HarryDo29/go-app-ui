import { useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Phone,
  Video,
  Search,
  MoreHorizontal,
} from "lucide-react";
import type { Conversation, Message } from "./types";
import { Avatar, IconBtn } from "./ui-primitives";
import { cn } from "@/lib/utils";

// ─── ChatHeader ───────────────────────────────────────────────────────────────
interface ChatHeaderProps {
  active: Conversation;
  showRight: boolean;
  onToggleRight: () => void;
}

export function ChatHeader({ active, showRight, onToggleRight }: ChatHeaderProps) {
  const subtitle =
    active.type === "group"
      ? `${active.members?.length ?? 0} thành viên`
      : active.online
        ? "Đang hoạt động"
        : "Hoạt động gần đây";

  return (
    <header className="h-16 px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar initials={active.avatar} size="md" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate">{active.name}</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <IconBtn title="Gọi thoại">
          <Phone size={18} />
        </IconBtn>
        <IconBtn title="Gọi video">
          <Video size={18} />
        </IconBtn>
        <IconBtn title="Tìm kiếm">
          <Search size={18} />
        </IconBtn>
        <IconBtn active={showRight} onClick={onToggleRight} title="Thông tin">
          <MoreHorizontal size={18} />
        </IconBtn>
      </div>
    </header>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────
interface MessageBubbleProps {
  message: Message;
  showAuthor: boolean;
  activeConvo: Conversation;
}

function MessageBubble({ message, showAuthor, activeConvo }: MessageBubbleProps) {
  const isMe = message.from === "me";
  const initials = (message.author ?? activeConvo.name)
    .split(" ")
    .map((s) => s[0])
    .slice(-2)
    .join("");

  return (
    <div className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
      {!isMe && (
        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[11px] font-semibold shrink-0">
          {initials}
        </div>
      )}
      <div className={cn("max-w-md flex flex-col", isMe ? "items-end" : "items-start")}>
        {showAuthor && (
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-1 ml-1">
            {message.author}
          </span>
        )}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
            isMe
              ? "bg-indigo-500 text-white rounded-br-md"
              : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-bl-md",
          )}
        >
          {message.text}
        </div>
        <span className="text-[10px] text-neutral-400 mt-1 px-1">{message.time}</span>
      </div>
    </div>
  );
}

// ─── MessageList ──────────────────────────────────────────────────────────────
interface MessageListProps {
  messages: Message[];
  activeConvo: Conversation;
}

export function MessageList({ messages, activeConvo }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
      <div className="text-center">
        <span className="text-[11px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800/60 px-3 py-1 rounded-full">
          Hôm nay
        </span>
      </div>
      {messages.map((msg, i) => {
        const prev = messages[i - 1];
        const showAuthor =
          activeConvo.type === "group" && msg.from === "them" && prev?.author !== msg.author;
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            showAuthor={showAuthor}
            activeConvo={activeConvo}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

// ─── MessageInput ─────────────────────────────────────────────────────────────
interface MessageInputProps {
  draft: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export function MessageInput({ draft, placeholder, onChange, onSend }: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="px-6 pb-5 pt-2 bg-neutral-50 dark:bg-neutral-950 shrink-0">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30 transition">
        <div className="flex items-end gap-1 px-2 py-2">
          <IconBtn title="Đính kèm tệp">
            <Paperclip size={18} />
          </IconBtn>
          <IconBtn title="Gửi hình ảnh">
            <ImageIcon size={18} />
          </IconBtn>
          <IconBtn title="Emoji">
            <Smile size={18} />
          </IconBtn>
          <textarea
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={placeholder}
            aria-label="Nhập tin nhắn"
            className="flex-1 resize-none bg-transparent outline-none text-sm py-2 px-2 max-h-32 placeholder:text-neutral-400"
          />
          <button
            onClick={onSend}
            disabled={!draft.trim()}
            aria-label="Gửi tin nhắn"
            className="h-9 w-9 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
