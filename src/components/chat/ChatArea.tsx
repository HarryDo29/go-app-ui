import React, { useRef, useEffect, useState } from "react";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Phone,
  Video,
  Search,
  MoreHorizontal,
  X,
  Loader2,
  Reply,
  Pencil,
  Trash2,
  RotateCcw,
  Check,
} from "lucide-react";
import type { Conversation, Message } from "./types";
import { Avatar, IconBtn } from "./ui-primitives";
import { cn } from "@/lib/utils";
import { generatePresignedUrlApi } from "@/lib/api/upload";
import axios from "axios";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/lib/auth-context";

// ─── ChatHeader ───────────────────────────────────────────────────────────────
interface ChatHeaderProps {
  active: Conversation;
  showRight: boolean;
  onToggleRight: () => void;
}

export function ChatHeader({ active, showRight, onToggleRight }: ChatHeaderProps) {
  const isGroup = active.channel_type === "group";
  const name = isGroup
    ? (active.group?.group_name ?? "Nhóm")
    : (active.subject?.user_name ?? "Bạn bè");
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  const avatarUrl = isGroup
    ? active.group?.avatar_url || undefined
    : active.subject?.avatar_url || undefined;
  const subtitle = isGroup ? `${active.group?.member_count ?? 0} thành viên` : "";

  return (
    <header className="h-16 px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar initials={initials} size="md" src={avatarUrl} />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate">{name}</h2>
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
interface MessageActionCallbacks {
  onReply: (message: Message) => void;
  onHide: (messageId: string) => void;
  onRecall: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
}

interface MessageBubbleProps {
  message: Message;
  showAuthor: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  activeConvo: Conversation;
  senderName: string;
  senderAvatarUrl?: string;
  actions: MessageActionCallbacks;
}

function MessageBubble({
  message,
  showAuthor,
  isFirstInGroup,
  isLastInGroup,
  activeConvo,
  senderName,
  senderAvatarUrl,
  actions,
}: MessageBubbleProps) {
  const { user } = useAuth();
  const isMe = message.from_id === "me" || (user && message.from_id === user.id);
  const isRecalled = message.is_delete;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const initials = senderName
    .split(" ")
    .map((s) => s[0])
    .slice(-2)
    .join("");
  const msgTime = message.created_at
    ? (() => {
        try {
          const d = new Date(message.created_at);
          return isNaN(d.getTime())
            ? ""
            : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        } catch {
          return "";
        }
      })()
    : "";

  const handleConfirmEdit = () => {
    if (!editContent.trim() || editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    actions.onEdit(message.msg_id, editContent.trim());
    setIsEditing(false);
  };

  const actionMenu = (
    <div
      className={cn(
        "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
        isMe ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Reply - all messages */}
      <button
        onClick={() => actions.onReply(message)}
        title="Trả lời"
        className="h-7 w-7 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-primary hover:border-primary/40 transition shadow-sm"
      >
        <Reply size={13} />
      </button>

      {/* Hide - all messages */}
      <button
        onClick={() => actions.onHide(message.msg_id)}
        title="Xóa với tôi"
        className="h-7 w-7 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-rose-500 hover:border-rose-400/40 transition shadow-sm"
      >
        <Trash2 size={13} />
      </button>

      {/* Recall + Edit - only my messages */}
      {isMe && !isRecalled && message.msg_type === "text" && (
        <button
          onClick={() => {
            setIsEditing(true);
            setEditContent(message.content);
          }}
          title="Chỉnh sửa"
          className="h-7 w-7 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-primary hover:border-primary/40 transition shadow-sm"
        >
          <Pencil size={13} />
        </button>
      )}
      {isMe && !isRecalled && (
        <button
          onClick={() => actions.onRecall(message.msg_id)}
          title="Thu hồi"
          className="h-7 w-7 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-amber-500 hover:border-amber-400/40 transition shadow-sm"
        >
          <RotateCcw size={13} />
        </button>
      )}
    </div>
  );

  const bubbleContent = (() => {
    if (isRecalled) {
      return (
        <span className="italic text-neutral-400 dark:text-neutral-500 text-xs">
          Tin nhắn đã được thu hồi
        </span>
      );
    }
    if (isEditing && message.msg_type === "text") {
      return (
        <div className="flex items-end gap-2 min-w-[180px]">
          <textarea
            autoFocus
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleConfirmEdit();
              }
              if (e.key === "Escape") setIsEditing(false);
            }}
            className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed max-h-24"
            rows={1}
          />
          <button
            onClick={handleConfirmEdit}
            className="h-5 w-5 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center shrink-0 transition"
          >
            <Check size={11} />
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="h-5 w-5 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center shrink-0 transition"
          >
            <X size={11} />
          </button>
        </div>
      );
    }
    if (message.msg_type === "image") {
      return (
        <img
          src={message.content}
          alt="Hình ảnh"
          className="max-w-xs max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => window.open(message.content, "_blank")}
        />
      );
    }
    if (message.msg_type === "file") {
      return (
        <a
          href={message.content}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:underline"
        >
          <Paperclip size={18} className={cn("shrink-0", isMe ? "text-white" : "text-primary")} />
          <span className="font-medium truncate max-w-[200px]">
            {message.content.split("/").pop() || "Tệp đính kèm"}
          </span>
        </a>
      );
    }
    return message.content;
  })();

  // Border radius: first/middle/last in group get different corners for a "connected bubble" feel
  const bubbleRadius = cn(
    "rounded-2xl",
    isMe
      ? [
          !isFirstInGroup && "!rounded-tr-md",
          !isLastInGroup && "!rounded-br-md",
          isLastInGroup && "rounded-br-md",
        ]
      : [
          !isFirstInGroup && "!rounded-tl-md",
          !isLastInGroup && "!rounded-bl-md",
          isLastInGroup && "rounded-bl-md",
        ],
  );

  return (
    <div
      className={cn(
        "flex items-end gap-2 group",
        isMe ? "justify-end" : "justify-start",
        !isFirstInGroup && "!mt-0.5",
      )}
    >
      {/* Avatar: only visible on last message of a group */}
      {!isMe && isLastInGroup ? (
        <Avatar initials={initials} size="sm" src={senderAvatarUrl || undefined} />
      ) : (
        <div className="w-8 shrink-0" />
      )}

      {/* Action menu left side (for my messages: shows on left of bubble) */}
      {isMe && !isRecalled && <div className="mb-5">{actionMenu}</div>}

      <div className={cn("max-w-md flex flex-col", isMe ? "items-end" : "items-start")}>
        {showAuthor && (
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-1 ml-1">
            {senderName}
          </span>
        )}
        <div
          className={cn(
            "text-sm leading-relaxed shadow-sm overflow-hidden",
            bubbleRadius,
            isRecalled
              ? "bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-2.5"
              : message.msg_type === "image"
                ? ""
                : isMe
                  ? "bg-primary text-primary-foreground px-4 py-2.5"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-2.5",
          )}
        >
          {bubbleContent}
        </div>
        {isLastInGroup && <span className="text-[10px] text-neutral-400 mt-1 px-1">{msgTime}</span>}
      </div>

      {/* Action menu right side (for others' messages: shows on right of bubble) */}
      {!isMe && !isRecalled && <div className="mb-5">{actionMenu}</div>}
    </div>
  );
}

// ─── MessageList ──────────────────────────────────────────────────────────────
interface MessageListProps {
  messages: Message[];
  activeConvo: Conversation;
  onReply: (message: Message) => void;
  onHide: (messageId: string) => void;
  onRecall: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
}

export function MessageList({
  messages,
  activeConvo,
  onReply,
  onHide,
  onRecall,
  onEdit,
}: MessageListProps) {
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Auto-scroll: instant khi mới load, smooth khi có tin nhắn mới
  useEffect(() => {
    if (!bottomRef.current) return;
    if (isFirstLoad.current) {
      bottomRef.current.scrollIntoView({ behavior: "instant" });
      isFirstLoad.current = false;
    } else {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Reset isFirstLoad khi đổi kênh (activeConvo thay đổi)
  useEffect(() => {
    isFirstLoad.current = true;
  }, [activeConvo.channel_id]);

  const formatDateLabel = (date: Date): string => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(d, today)) return "Hôm nay";
    if (sameDay(d, yesterday)) return "Hôm qua";

    const weekdays = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return `${weekdays[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  };

  const getDateKey = (date: Date): string => {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  // Resolve sender name and avatar from conversation data based on from_id
  const getSenderInfo = (fromId: string): { name: string; avatarUrl?: string } => {
    if (activeConvo.channel_type === "group") {
      const member = activeConvo.group?.members?.find((m) => m.user?.user_id === fromId);
      if (member?.user) {
        return {
          name: member.user.user_name ?? "",
          avatarUrl: member.user.avatar_url,
        };
      }
      return { name: fromId };
    }
    // friends / direct channel: the other person is always subject
    return {
      name: activeConvo.subject?.user_name ?? "",
      avatarUrl: activeConvo.subject?.avatar_url,
    };
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
      {messages.map((msg, i) => {
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const showDateSeparator =
          !prev || getDateKey(msg.created_at) !== getDateKey(prev.created_at);
        const nextHasDifferentDay =
          !next || getDateKey(next.created_at) !== getDateKey(msg.created_at);

        const isFirstInGroup = showDateSeparator || !prev || prev.from_id !== msg.from_id;
        const isLastInGroup = !next || next.from_id !== msg.from_id || nextHasDifferentDay;

        const isMe = msg.from_id === "me" || (user && msg.from_id === user.id);
        const showAuthor = activeConvo.channel_type === "group" && !isMe && isFirstInGroup;

        const sender = getSenderInfo(msg.from_id);

        return (
          <React.Fragment key={msg.msg_id}>
            {showDateSeparator && (
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700/60" />
                <span className="text-[11px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800/60 px-3 py-1 rounded-full whitespace-nowrap">
                  {formatDateLabel(msg.created_at)}
                </span>
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700/60" />
              </div>
            )}
            <MessageBubble
              message={msg}
              showAuthor={showAuthor}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
              activeConvo={activeConvo}
              senderName={sender.name}
              senderAvatarUrl={sender.avatarUrl}
              actions={{ onReply, onHide, onRecall, onEdit }}
            />
          </React.Fragment>
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
  replyTo?: Message | null;
  onCancelReply?: () => void;
  onChange: (value: string) => void;
  onSend: (attachment?: { url: string; type: "image" | "file"; name: string }) => void;
}

export function MessageInput({
  draft,
  placeholder,
  replyTo,
  onCancelReply,
  onChange,
  onSend,
}: MessageInputProps) {
  const [attachment, setAttachment] = useState<{
    url: string;
    type: "image" | "file";
    name: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "file",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const objectName = `msg_${Date.now()}.${ext}`;

      const presignedRes = await generatePresignedUrlApi({
        object_name: objectName,
        content_type: file.type,
        folder: type === "image" ? "images" : "files",
      });

      const uploadUrl = presignedRes.data?.url || presignedRes.url;
      if (!uploadUrl) {
        throw new Error("Không lấy được URL tải lên từ server.");
      }

      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      const cleanUrl = uploadUrl.split("?")[0];
      setAttachment({
        url: cleanUrl,
        type,
        name: file.name,
      });
      toast.success("Tải tệp lên thành công!");
    } catch (err: any) {
      console.error("Lỗi tải tệp:", err);
      toast.error(err?.message || "Lỗi khi tải tệp lên.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleSendClick = () => {
    if (!draft.trim() && !attachment) return;
    onSend(attachment || undefined);
    setAttachment(null);
    onCancelReply?.();
  };

  return (
    <div className="px-6 pb-5 pt-2 bg-neutral-50 dark:bg-neutral-950 shrink-0 flex flex-col gap-2">
      {/* Reply Banner */}
      {replyTo && !replyTo.is_delete && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 dark:bg-primary/10 border-l-2 border-primary rounded-lg">
          <Reply size={14} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-primary mb-0.5">Trả lời tin nhắn</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {replyTo.msg_type === "image"
                ? "🖼️ Hình ảnh"
                : replyTo.msg_type === "file"
                  ? "📎 Tệp đính kèm"
                  : replyTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="h-5 w-5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Attachment Preview Area */}
      {(attachment || isUploading) && (
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-md">
          {isUploading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin text-primary animate-duration-1000" />
              <span>Đang tải tệp lên...</span>
            </div>
          ) : attachment ? (
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-2 min-w-0">
                {attachment.type === "image" ? (
                  <img
                    src={attachment.url}
                    alt="Preview"
                    className="h-10 w-10 object-cover rounded-lg border border-neutral-200 dark:border-neutral-800 shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-primary shrink-0">
                    <Paperclip size={18} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate text-neutral-700 dark:text-neutral-200">
                    {attachment.name}
                  </p>
                  <p className="text-[10px] text-neutral-400 uppercase">
                    {attachment.type === "image" ? "Hình ảnh" : "Tệp tin"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAttachment(null)}
                className="h-6 w-6 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center justify-center transition"
              >
                <X size={14} />
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e, "file")}
        className="hidden"
      />
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        onChange={(e) => handleFileUpload(e, "image")}
        className="hidden"
      />

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/30 transition">
        <div className="flex items-end gap-1 px-2 py-2">
          <IconBtn
            title="Đính kèm tệp"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip size={18} />
          </IconBtn>
          <IconBtn
            title="Gửi hình ảnh"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploading}
          >
            <ImageIcon size={18} />
          </IconBtn>

          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={placeholder}
            aria-label="Nhập tin nhắn"
            className="flex-1 resize-none bg-transparent outline-none text-sm py-2 px-2 max-h-32 placeholder:text-neutral-400"
          />
          <button
            onClick={handleSendClick}
            disabled={(!draft.trim() && !attachment) || isUploading}
            aria-label="Gửi tin nhắn"
            className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
