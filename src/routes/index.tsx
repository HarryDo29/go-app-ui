import { useState, useEffect } from "react";

import { friends, groups, initialMessages } from "@/components/chat/types";
import type { TabKey, Message } from "@/components/chat/types";
import { PrimarySidebar } from "@/components/chat/PrimarySidebar";
import { ConversationPanel } from "@/components/chat/ConversationPanel";
import { ChatHeader, MessageList, MessageInput } from "@/components/chat/ChatArea";
import { RightPanel } from "@/components/chat/RightPanel";

export default function ChatApp() {
  const [tab, setTab] = useState<TabKey>("friends");
  const [activeId, setActiveId] = useState<string>("f1");
  const [showRight, setShowRight] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [dark, setDark] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  // Sync dark mode with document root
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Derived state
  const myFriends = friends.filter((f) => !f.isStranger);
  const strangers = friends.filter((f) => f.isStranger);
  const list = tab === "groups" ? groups : myFriends;
  const allConvos = [...friends, ...groups];
  const active = allConvos.find((c) => c.id === activeId) ?? friends[0];
  const msgs = messages[active.id] ?? [];

  // Handlers
  const handleTabChange = (next: TabKey) => {
    setTab(next);
    setShowNotif(false);
  };

  const handleToggleNotif = () => setShowNotif((v) => !v);

  const handleSend = () => {
    if (!draft.trim()) return;
    const msg: Message = {
      id: String(Date.now()),
      from: "me",
      text: draft.trim(),
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => ({
      ...prev,
      [active.id]: [...(prev[active.id] ?? []), msg],
    }));
    setDraft("");
  };

  const handleSendRequest = (id: string) => {
    setSentRequests((prev) => new Set(prev).add(id));
  };

  return (
    <div className="h-screen w-full bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex overflow-hidden font-sans antialiased">
      {/* ① Primary nav sidebar */}
      <PrimarySidebar
        tab={tab}
        showNotif={showNotif}
        dark={dark}
        onTabChange={handleTabChange}
        onToggleNotif={handleToggleNotif}
        onToggleDark={() => setDark((v) => !v)}
      />

      {/* ② Conversation / notification list */}
      <ConversationPanel
        tab={tab}
        showNotif={showNotif}
        list={list}
        strangers={strangers}
        activeId={active.id}
        sentRequests={sentRequests}
        onSelectConvo={(id) => {
          setActiveId(id);
          setShowNotif(false);
        }}
        onSendRequest={handleSendRequest}
      />

      {/* ③ Main chat area */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-50 dark:bg-neutral-950">
        <ChatHeader
          active={active}
          showRight={showRight}
          onToggleRight={() => setShowRight((v) => !v)}
        />
        <MessageList messages={msgs} activeConvo={active} />
        <MessageInput
          draft={draft}
          placeholder={`Nhắn tin tới ${active.name}...`}
          onChange={setDraft}
          onSend={handleSend}
        />
      </main>

      {/* ④ Right info panel (toggleable) */}
      {showRight && <RightPanel active={active} onClose={() => setShowRight(false)} />}
    </div>
  );
}
