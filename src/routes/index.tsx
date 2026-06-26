import { useState, useEffect } from "react";
import { MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getUserChannelsApi, addChannelMemberApi } from "@/lib/api/channels";
import { createGroupApi } from "@/lib/api/groups";

import type { TabKey, Message, Channel } from "@/components/chat/types";
import { PrimarySidebar } from "@/components/chat/PrimarySidebar";
import { ConversationPanel } from "@/components/chat/ConversationPanel";
import { ChatHeader, MessageList, MessageInput } from "@/components/chat/ChatArea";
import { RightPanel } from "@/components/chat/RightPanel";
import {
  getChannelMessagesApi,
  createMessageApi,
  recallMessageApi,
  hideMessageApi,
  updateMessageApi,
} from "@/lib/api/messages";
import { toast } from "sonner";

export default function ChatApp() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("friends");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showRight, setShowRight] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<import("@/components/chat/types").Message | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<Channel[]>([]);
  const [groups, setGroups] = useState<Channel[]>([]);

  // Derived state
  const list = tab === "groups" ? groups : friends;
  const allChannels = [...friends, ...groups];
  const active = activeId ? (allChannels.find((c) => c.channel_id === activeId) ?? null) : null;
  const msgs = active ? (messages[active.channel_id] ?? []) : [];

  // handleTabChangeToFriend
  const fetchDirectChannels = async () => {
    try {
      const { data } = await getUserChannelsApi("direct");
      console.log("friends: ", data);
      setFriends(data);
    } catch (err) {
      console.error("Lỗi lấy danh sách direct channels:", err);
    }
  };

  // handleTabChangeToGroup
  const fetchGroupChannels = async () => {
    try {
      const { data } = await getUserChannelsApi("group");
      console.log("groups: ", data);
      setGroups(data);
    } catch (err) {
      console.error("Lỗi lấy danh sách group channels:", err);
    }
  };

  // Tự động tải data khi user đã login
  useEffect(() => {
    if (user) {
      fetchDirectChannels();
      fetchGroupChannels();
    }
  }, [user]);

  // Tự động tải tin nhắn khi đổi cuộc hội thoại
  useEffect(() => {
    if (!activeId) return;
    const fetchMessages = async () => {
      try {
        const res = await getChannelMessagesApi(activeId);
        const msgsData = res?.data || res;
        if (Array.isArray(msgsData)) {
          // Sắp xếp tăng dần theo thời gian tạo (cũ → mới) để tin nhắn mới nhất ở dưới cùng
          const sorted = [...msgsData].sort((a, b) => {
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
            return ta - tb;
          });
          setMessages((prev) => ({
            ...prev,
            [activeId]: sorted,
          }));
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách tin nhắn từ backend:", err);
      }
    };
    fetchMessages();
  }, [activeId]);

  // Handlers
  const handleTabChange = (next: TabKey) => {
    setTab(next);
    setShowNotif(false);
  };

  const handleToggleNotif = () => setShowNotif((v) => !v);

  const handleSend = async (attachment?: { url: string; type: "image" | "file"; name: string }) => {
    if (!draft.trim() && !attachment) return;
    if (!active) return;

    const repliedToId = replyTo?.msg_id ?? "";

    // 1. Gửi tệp đính kèm trước nếu có
    if (attachment) {
      try {
        const res = await createMessageApi({
          channel_id: active.channel_id,
          content: attachment.url,
          msg_type: attachment.type,
          replied_to_msg_id: repliedToId,
        });
        const newMsg = res?.data || res;
        setMessages((prev) => ({
          ...prev,
          [active.channel_id]: [...(prev[active.channel_id] ?? []), newMsg],
        }));
      } catch (err) {
        console.error("Lỗi gửi tin nhắn tệp tin:", err);
      }
    }

    // 2. Gửi tin nhắn văn bản nếu có
    if (draft.trim()) {
      const textToSend = draft.trim();
      setDraft(""); // clear draft immediately for responsiveness
      try {
        const res = await createMessageApi({
          channel_id: active.channel_id,
          content: textToSend,
          msg_type: "text",
          replied_to_msg_id: repliedToId,
        });
        const newMsg = res?.data || res;
        setMessages((prev) => ({
          ...prev,
          [active.channel_id]: [...(prev[active.channel_id] ?? []), newMsg],
        }));
      } catch (err) {
        console.error("Lỗi gửi tin nhắn văn bản:", err);
      }
    }
  };

  const handleSendRequest = (id: string) => {
    setSentRequests((prev) => new Set(prev).add(id));
  };

  const handleReply = (message: import("@/components/chat/types").Message) => {
    setReplyTo(message);
  };

  const handleHide = async (messageId: string) => {
    if (!active) return;
    try {
      await hideMessageApi(messageId, active.channel_id);
      setMessages((prev) => ({
        ...prev,
        [active.channel_id]: (prev[active.channel_id] ?? []).filter((m) => m.msg_id !== messageId),
      }));
      toast.success("Đã xóa tin nhắn với bạn.");
    } catch (err) {
      console.error("Lỗi ẩn tin nhắn:", err);
      toast.error("Không thể xóa tin nhắn.");
    }
  };

  const handleRecall = async (messageId: string) => {
    if (!active) return;
    try {
      await recallMessageApi(messageId);
      setMessages((prev) => ({
        ...prev,
        [active.channel_id]: (prev[active.channel_id] ?? []).map((m) =>
          m.msg_id === messageId ? { ...m, is_delete: true } : m,
        ),
      }));
      toast.success("Đã thu hồi tin nhắn.");
    } catch (err) {
      console.error("Lỗi thu hồi tin nhắn:", err);
      toast.error("Không thể thu hồi tin nhắn.");
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    if (!active) return;
    try {
      await updateMessageApi(messageId, { content: newContent });
      setMessages((prev) => ({
        ...prev,
        [active.channel_id]: (prev[active.channel_id] ?? []).map((m) =>
          m.msg_id === messageId ? { ...m, content: newContent } : m,
        ),
      }));
      toast.success("Đã chỉnh sửa tin nhắn.");
    } catch (err) {
      console.error("Lỗi chỉnh sửa tin nhắn:", err);
      toast.error("Không thể chỉnh sửa tin nhắn.");
    }
  };

  const handleCreateGroup = async (groupName: string, selectedUserIds: string[]) => {
    if (!user) return;
    try {
      const res = await createGroupApi({
        group_name: groupName,
        owner_id: user.id,
        member_count: selectedUserIds.length + 1,
      });

      const newGroupId = res.data?.group_id || res.group_id;
      if (!newGroupId) {
        throw new Error("Không thể tạo nhóm: group_id trống.");
      }

      const channelRes = await getUserChannelsApi("group");
      const channels = channelRes.data || channelRes || [];
      const newChannel = channels.find((c: any) => c.group?.group_id === newGroupId);

      if (!newChannel) {
        throw new Error("Không tìm thấy kênh của nhóm vừa tạo.");
      }

      const channelId = newChannel.channel_id;

      if (selectedUserIds.length > 0) {
        await addChannelMemberApi({
          channel_id: channelId,
          user_ids: selectedUserIds,
          role: "member",
          status: "active",
        });
      }

      const finalChannelsRes = await getUserChannelsApi("group");
      const updatedGroups = finalChannelsRes.data || finalChannelsRes || [];
      setGroups(updatedGroups);
      setTab("groups");
      setActiveId(channelId);
      toast.success(`Đã tạo nhóm "${groupName}" thành công!`);
    } catch (err) {
      console.error("Lỗi tạo nhóm:", err);
      toast.error("Không thể tạo nhóm mới.");
      throw err;
    }
  };

  return (
    <div className="h-screen w-full bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex overflow-hidden font-sans antialiased">
      {/* Primary nav sidebar */}
      <PrimarySidebar
        tab={tab}
        showNotif={showNotif}
        onTabChange={handleTabChange}
        onToggleNotif={handleToggleNotif}
      />

      {/* Conversation / notification list */}
      <ConversationPanel
        tab={tab}
        showNotif={showNotif}
        list={list}
        friendsList={friends}
        strangers={[]}
        activeId={activeId}
        sentRequests={sentRequests}
        onSelectConvo={(id) => {
          setActiveId(id);
          setShowNotif(false);
        }}
        onSendRequest={handleSendRequest}
        onCreateGroup={handleCreateGroup}
      />

      {/* ③ Main chat area */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-50 dark:bg-neutral-950">
        {active ? (
          <>
            <ChatHeader
              active={active}
              showRight={showRight}
              onToggleRight={() => setShowRight((v) => !v)}
            />
            <MessageList
              messages={msgs}
              activeConvo={active}
              onReply={handleReply}
              onHide={handleHide}
              onRecall={handleRecall}
              onEdit={handleEdit}
            />
            <MessageInput
              draft={draft}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              placeholder={`Nhắn tin tới ${
                active.channel_type === "group"
                  ? (active.group?.group_name ?? "nhóm")
                  : (active.subject?.user_name ?? "bạn bè")
              }...`}
              onChange={setDraft}
              onSend={handleSend}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-neutral-400 dark:text-neutral-500">
            <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center">
              <MessageSquarePlus size={36} className="text-neutral-300 dark:text-neutral-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-neutral-500 dark:text-neutral-400">
                Chào mừng bạn!
              </p>
              <p className="text-sm mt-1 max-w-xs">
                Chọn một cuộc trò chuyện từ danh sách bên trái hoặc bắt đầu cuộc hội thoại mới.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ④ Right info panel (toggleable) */}
      {showRight && active && (
        <RightPanel
          active={active}
          onClose={() => setShowRight(false)}
          onUpdate={active.channel_type === "group" ? fetchGroupChannels : fetchDirectChannels}
        />
      )}
    </div>
  );
}
