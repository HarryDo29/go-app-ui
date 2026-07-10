// ─── Types ────────────────────────────────────────────────────────────────────

export type TabKey = "friends" | "groups" | "notifications";

export type ConversationType = "dm" | "group";

export type Member = {
  member_id: string;
  channel_id: string;
  user: Subject;
  role: string;
  status: string;
  joined_at: Date;
};

export type Subject = {
  user_id: string;
  user_name: string;
  email: string;
  is_active: boolean;
  role: string;
  avatar_url?: string;
};

export type Group = {
  group_id: string;
  group_name: string;
  owner_id: string;
  member_count: number;
  status: string;
  members: Member[];
  avatar?: string;
  avatar_url?: string;
};

export type Message = {
  msg_id: string;
  channel_id: string;
  from_id: string;
  content: string;
  msg_type: string;
  msg_seq: number;
  status: string;
  is_delete: boolean;
  replied_to_msg_id: string;
  created_at: Date;
};

export type Conversation = {
  channel_id: string;
  channel_key: string;
  channel_type: string;
  subject: Subject;
  group: Group;
  last_msg: Message;
  updated_at: Date;
};

// Channel is an alias for Conversation (used interchangeably)
export type Channel = Conversation;

export type Notification = {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread?: boolean;
};
