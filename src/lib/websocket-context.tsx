import React, { createContext, useContext } from "react";
import useWebSocket, { SendMessage } from "react-use-websocket";
import { useAuth } from "@/lib/auth-context";
import { getCookie, setCookie } from "@/lib/cookies";
import { Channel, Message } from "@/components/chat/types";

export enum WebsocketMessageAction {
  NEW = "new",
  EDIT = "edit",
  DELETE = "delete",
  RECALL = "recall",
}

export enum WebsocketEvent {
  EventNewChannel = "NEW_CHANNEL",
  EventUpdatedChannel = "UPDATED_CHANNEL",
  EventDeletedChannel = "DELETED_CHANNEL",
  EventRemovedFromChannel = "REMOVED_FROM_CHANNEL",
  // --- Message ---
  EventNewMessage = "NEW_MESSAGE",
  EventUpdatedMessage = "UPDATED_MESSAGE",
  EventRecallMessage = "RECALLED_MESSAGE",
  // --- Connection(Friend) ---
  EventNewConnection = "NEW_CONNECTION",
}

export interface WebsocketMsg {
  event: WebsocketEvent;
  payload: any;
}

interface WebSocketContextType {
  sendMessage: SendMessage;
  lastJsonMessage: WebsocketMsg;
  readyState: number;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const token = getCookie("access_token");
  const deviceId = getCookie("device_id") || crypto.randomUUID();
  setCookie("device_id", deviceId);

  // Chỉ kết nối khi có user và token
  const WS_URL =
    user && token && import.meta.env.VITE_API_WS_URL
      ? `${import.meta.env.VITE_API_WS_URL}?token=${token}&connectionId=${deviceId}`
      : null;

  const { sendMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL, {
    share: true,
    shouldReconnect: () => true, // reconnect
    reconnectAttempts: 10,
    // Thử kết nối lại với thời gian tăng dần, tối đa chờ 10 giây
    reconnectInterval: (attemptNumber) => Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
    onOpen: () => console.log("🔗 Đã kết nối WebSocket toàn cục"),
    onClose: () => console.log("🔌 Đã ngắt kết nối WebSocket"),
    onError: (error) => console.error("❌ Lỗi WebSocket:", error),
  });

  return (
    <WebSocketContext.Provider
      value={{
        sendMessage,
        lastJsonMessage: lastJsonMessage as any,
        readyState,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom Hook để lấy WebSocket instance
export const useAppWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useAppWebSocket phải được bọc bên trong WebSocketProvider");
  }
  return context;
};
