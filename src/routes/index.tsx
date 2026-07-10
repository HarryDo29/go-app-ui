import { useState, useEffect } from "react";
import { MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getUserChannelsApi, addChannelMemberApi } from "@/lib/api/channels";
import { createGroupApi } from "@/lib/api/groups";
import { cn } from "@/lib/utils";

import type { TabKey, Message, Channel } from "@/components/chat/types";
import { PrimarySidebar } from "@/components/chat/PrimarySidebar";
import { ConversationPanel } from "@/components/chat/ConversationPanel";
import { ChatHeader, MessageList, MessageInput } from "@/components/chat/ChatArea";
import { RightPanel } from "@/components/chat/RightPanel";
import { searchUsersApi } from "@/lib/api/users";
import {
  createConnectionApi,
  getUserConnectionsApi,
  respondConnectionApi,
} from "@/lib/api/connections";
import type { PendingConnection } from "@/components/chat/ConversationPanel";
import {
  getChannelMessagesApi,
  createMessageApi,
  recallMessageApi,
  hideMessageApi,
  updateMessageApi,
} from "@/lib/api/messages";
import { toast } from "sonner";
import { useAppWebSocket, WebsocketMsg, WebsocketEvent } from "@/lib/websocket-context";

export default function ChatApp() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("friends");
  const [activeId, setActiveId] = useState<string | null>(null); // channel_id trong msg
  const [showRight, setShowRight] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<Channel[]>([]);
  const [groups, setGroups] = useState<Channel[]>([]);
  const [pendingConnections, setPendingConnections] = useState<PendingConnection[]>([]);

  // 1. Kết nối WebSocket toàn cục
  const { sendMessage, lastJsonMessage } = useAppWebSocket();

  // 2. Lắng nghe tin nhắn mới từ WebSocket (chỉ nhận NEW_MESSAGE, các action khác xử lý qua API)
  useEffect(() => {
    if (lastJsonMessage) {
      console.log("📨 Nhận tin nhắn từ WS:", lastJsonMessage);
      const { event, payload } = lastJsonMessage as WebsocketMsg;
      console.log("📨 Nhận từ WS:", event, payload);

      switch (event) {
        case WebsocketEvent.EventNewChannel: {
          const channelPayload = payload as Channel;
          if (!channelPayload?.channel_id) break;

          const isGroup = channelPayload.channel_type === "group";
          const setList = isGroup ? setGroups : setFriends;

          setList((prev) => {
            const filtered = prev.filter((c) => c.channel_id !== channelPayload.channel_id);
            return [channelPayload, ...filtered];
          });
          break;
        }

        case WebsocketEvent.EventUpdatedChannel: {
          const channelPayload = payload as Channel;
          if (!channelPayload?.channel_id) break;

          const isGroup = channelPayload.channel_type === "group";
          const setList = isGroup ? setGroups : setFriends;

          setList((prev) => {
            const filtered = prev.filter((c) => c.channel_id !== channelPayload.channel_id);
            return [channelPayload, ...filtered];
          });
          break;
        }

        case WebsocketEvent.EventDeletedChannel: {
          // TODO: Tự xử lý logic khi có người rời nhóm/bị kick
          // const memberPayload = payload as Member;
          break;
        }

        case WebsocketEvent.EventRemovedFromChannel: {
          // TODO: Tự xử lý logic khi có người rời nhóm/bị kick
          // const memberPayload = payload as Member;
          break;
        }

        case WebsocketEvent.EventNewMessage: {
          const msgPayload = payload as Message;
          if (!msgPayload?.channel_id) break;

          setMessages((prev) => {
            const current = prev[msgPayload.channel_id] || [];
            const isExist = current.some((m) => m.msg_id === msgPayload.msg_id);

            if (isExist) {
              console.warn("⚠️ Tin nhắn đã tồn tại (trùng msg_id), bỏ qua:", msgPayload.msg_id);
              return prev;
            }

            return { ...prev, [msgPayload.channel_id]: [...current, msgPayload] };
          });

          // Cập nhật last_msg và đẩy channel lên đầu danh sách
          const updateChannelOnNewMessage = (prevChannels: Channel[]) => {
            const targetChannel = prevChannels.find((c) => c.channel_id === msgPayload.channel_id);
            if (!targetChannel) return prevChannels;

            const updatedChannel: Channel = {
              ...targetChannel,
              last_msg: msgPayload,
              updated_at: msgPayload.created_at || new Date().toISOString(),
            };

            const filtered = prevChannels.filter((c) => c.channel_id !== msgPayload.channel_id);
            return [updatedChannel, ...filtered];
          };

          setFriends(updateChannelOnNewMessage);
          setGroups(updateChannelOnNewMessage);
          break;
        }

        case WebsocketEvent.EventUpdatedMessage:
        case WebsocketEvent.EventRecallMessage: {
          const msgPayload = payload as Message;
          if (!msgPayload?.channel_id || !msgPayload?.msg_id) break;

          setMessages((prev) => {
            const current = prev[msgPayload.channel_id] || [];
            return {
              ...prev,
              [msgPayload.channel_id]: current.map((m) =>
                m.msg_id === msgPayload.msg_id ? msgPayload : m,
              ),
            };
          });
          break;
        }

        case WebsocketEvent.EventNewConnection: {
          // Ai đó gửi lời mời kết bạn cho mình
          const connPayload = payload as any;
          if (!connPayload?.connection_id) break;

          const newPending: PendingConnection = {
            connection_id: connPayload.connection_id,
            requester_id: connPayload.requester_id,
            user_name: connPayload.user_name || connPayload.requester_name || "Unknown",
            email: connPayload.email || connPayload.requester_email || "",
            avatar_url: connPayload.avatar_url,
          };

          setPendingConnections((prev) => {
            const filtered = prev.filter((c) => c.connection_id !== newPending.connection_id);
            return [newPending, ...filtered];
          });
          break;
        }

        default:
          console.log("⚠️ Unhandled WebSocket event:", event);
          break;
      }
    }
  }, [lastJsonMessage]);

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

  // Tải danh sách connection PENDING khi app khởi động
  useEffect(() => {
    if (!user?.id) return;
    const fetchPendingConnections = async () => {
      try {
        const res = await getUserConnectionsApi("PENDING");
        console.log("pending connection: ", res.data);
        const connections = res?.data;
        // API đã lọc sẵn PENDING, map trực tiếp sang PendingConnection
        // Chỉ hiển thị những lời mời mà mình là receiver (không phải người đã gửi)
        console.log("user: ", user);
        const pending = connections
          .filter((c: any) => c.receiver_id === user.id)
          .map((c: any) => ({
            connection_id: c.connection_id,
            requester_id: c.requester_id,
            user_name: c.requester?.user_name || c.requester_name || "Unknown",
            email: c.requester?.email || c.requester_email || "",
            avatar_url: c.requester?.avatar_url || c.avatar_url,
          }));
        setPendingConnections(pending);
      } catch (err) {
        console.error("Lỗi tải pending connections:", err);
      }
    };
    fetchPendingConnections();
  }, [user?.id]);

  // Tự động tải data khi user đã login
  useEffect(() => {
    if (user) {
      fetchDirectChannels();
      fetchGroupChannels();
    }
  }, [user]);

  // Tự động tải tin nhắn của cuộc hội thoại khi chọn
  useEffect(() => {
    if (!activeId) return;
    // BEST PRACTICE 1: Cache tin nhắn ở Client
    // Nếu channel này đã có mảng tin nhắn (tức là đã load 1 lần rồi) thì KHÔNG gọi API nữa.
    if (messages[activeId] !== undefined) {
      return;
    }

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
        // Tránh loop fetch nếu lỗi, ta set mảng rỗng để đánh dấu là đã load
        setMessages((prev) => ({ ...prev, [activeId]: [] }));
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
        await createMessageApi({
          channel_id: active.channel_id,
          content: attachment.url,
          msg_type: attachment.type,
          replied_to_msg_id: repliedToId,
        });
        // Không cập nhật state ở đây nữa. Nhường cho WebSocket xử lý
      } catch (err) {
        console.error("Lỗi gửi tin nhắn tệp tin:", err);
      }
    }

    // 2. Gửi tin nhắn văn bản nếu có
    if (draft.trim()) {
      const textToSend = draft.trim();
      setDraft(""); // Xóa input text để tạo cảm giác phản hồi nhanh cho UI
      try {
        await createMessageApi({
          channel_id: active.channel_id,
          content: textToSend,
          msg_type: "text",
          replied_to_msg_id: repliedToId,
        });
        // Không cập nhật state ở đây nữa. Nhường cho WebSocket xử lý
      } catch (err) {
        console.error("Lỗi gửi tin nhắn văn bản:", err);
      }
    }
  };

  const handleSendRequest = async (id: string) => {
    try {
      if (user?.id) {
        await createConnectionApi({
          request_id: user.id,
          receive_id: id,
        });
        setSentRequests((prev) => new Set(prev).add(id));
        toast.success("Đã gửi yêu cầu kết bạn!");
      }
    } catch (err) {
      console.error("Ụu cầu kết bạn lỗi:", err);
      toast.error("Ụu cầu kết bạn thất bại.");
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      await respondConnectionApi(connectionId, "ACCEPTED");
      setPendingConnections((prev) => prev.filter((c) => c.connection_id !== connectionId));
      toast.success("Đã chấp nhận lời mời kết bạn!");
      // WS sẽ bắn NEW_CHANNEL để cập nhật danh sách bạn bè
    } catch (err) {
      console.error("Ụu cầu chấp nhận lỗi:", err);
      toast.error("Không thể chấp nhận lời mời.");
    }
  };

  const handleRejectConnection = async (connectionId: string) => {
    try {
      await respondConnectionApi(connectionId, "REJECTED");
      setPendingConnections((prev) => prev.filter((c) => c.connection_id !== connectionId));
      toast.success("Đã từ chối lời mời.");
    } catch (err) {
      console.error("Ụu cầu từ chối lỗi:", err);
      toast.error("Không thể từ chối lời mời.");
    }
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

      const channelId = res.data?.channel_id;

      if (channelId && selectedUserIds.length > 0) {
        await addChannelMemberApi({
          channel_id: channelId,
          user_ids: selectedUserIds,
          role: "member",
          status: "active",
        });
      }

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
        pendingCount={pendingConnections.length}
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
        pendingConnections={pendingConnections}
        onSelectConvo={(id) => {
          setActiveId(id);
          setShowNotif(false);
        }}
        onSendRequest={handleSendRequest}
        onAcceptConnection={handleAcceptConnection}
        onRejectConnection={handleRejectConnection}
        onCreateGroup={handleCreateGroup}
      />

      {/* ③ Main chat area */}
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-neutral-50 dark:bg-neutral-950",
          !activeId && "hidden sm:flex",
        )}
      >
        {active ? (
          <>
            <ChatHeader
              active={active}
              showRight={showRight}
              onToggleRight={() => setShowRight((v) => !v)}
              onBack={() => setActiveId(null)}
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
            <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] flex items-center justify-center">
              <MessageSquarePlus size={36} className="text-neutral-300 dark:text-neutral-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-neutral-500 dark:text-neutral-400">
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
