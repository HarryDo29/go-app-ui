// ─── Types ────────────────────────────────────────────────────────────────────

export type TabKey = "friends" | "groups" | "notifications";

export type ConversationType = "dm" | "group";

export type Member = {
  name: string;
  avatar: string;
  role?: string;
};

export type Conversation = {
  id: string;
  name: string;
  avatar: string;
  last: string;
  time: string;
  unread?: number;
  online?: boolean;
  type: ConversationType;
  members?: Member[];
  isStranger?: boolean;
  role?: string;
};

export type Message = {
  id: string;
  from: "me" | "them";
  author?: string;
  text: string;
  time: string;
};

// ─── Static Data ──────────────────────────────────────────────────────────────

export const friends: Conversation[] = [
  {
    id: "f1",
    name: "Mai Linh",
    avatar: "ML",
    last: "Đã gửi báo cáo nhé bạn",
    time: "09:42",
    unread: 2,
    online: true,
    type: "dm",
    role: "Product Manager",
  },
  {
    id: "f2",
    name: "Hoàng Anh",
    avatar: "HA",
    last: "Ok, mai họp lúc 10h",
    time: "08:15",
    online: true,
    type: "dm",
    role: "Backend Engineer",
  },
  {
    id: "f3",
    name: "Thu Hằng",
    avatar: "TH",
    last: "Cảm ơn anh nhiều ạ",
    time: "T2",
    type: "dm",
    role: "QA Lead",
  },
  {
    id: "f4",
    name: "Đức Minh",
    avatar: "DM",
    last: "File đính kèm.pdf",
    time: "CN",
    type: "dm",
    role: "Designer",
  },
  {
    id: "f5",
    name: "Phương Vy",
    avatar: "PV",
    last: "Đang xem lại design",
    time: "28/05",
    online: true,
    type: "dm",
    role: "UX Designer",
  },
  {
    id: "f6",
    name: "Quốc Bảo",
    avatar: "QB",
    last: "Phòng Nhân sự",
    time: "",
    isStranger: true,
    type: "dm",
    role: "HR Specialist",
  },
  {
    id: "f7",
    name: "Tuấn Khang",
    avatar: "TK",
    last: "Phòng Tài chính",
    time: "",
    isStranger: true,
    type: "dm",
    role: "Accountant",
  },
];

export const groups: Conversation[] = [
  {
    id: "g1",
    name: "Product Team",
    avatar: "PT",
    last: "An: Demo sprint chiều nay",
    time: "10:02",
    unread: 5,
    type: "group",
    members: [
      { name: "Mai Linh", avatar: "ML", role: "Admin" },
      { name: "Hoàng Anh", avatar: "HA" },
      { name: "Thu Hằng", avatar: "TH" },
      { name: "Đức Minh", avatar: "DM" },
      { name: "Phương Vy", avatar: "PV" },
    ],
  },
  {
    id: "g2",
    name: "Design Review",
    avatar: "DR",
    last: "Vy: Đã update mockup v3",
    time: "09:30",
    type: "group",
    members: [
      { name: "Phương Vy", avatar: "PV", role: "Admin" },
      { name: "Mai Linh", avatar: "ML" },
      { name: "Đức Minh", avatar: "DM" },
    ],
  },
  {
    id: "g3",
    name: "Marketing Q2",
    avatar: "MQ",
    last: "Linh: Kế hoạch tuần tới",
    time: "T3",
    type: "group",
    members: [
      { name: "Mai Linh", avatar: "ML", role: "Admin" },
      { name: "Hoàng Anh", avatar: "HA" },
    ],
  },
];

export const notifications = [
  {
    id: "n1",
    title: "Mai Linh đã nhắc đến bạn",
    desc: "trong Product Team",
    time: "5 phút trước",
    unread: true,
  },
  {
    id: "n2",
    title: "Hoàng Anh đã thêm bạn vào nhóm",
    desc: "Design Review",
    time: "1 giờ trước",
    unread: true,
  },
  {
    id: "n3",
    title: "Cuộc họp sắp diễn ra",
    desc: "Sprint Planning lúc 14:00",
    time: "2 giờ trước",
  },
  {
    id: "n4",
    title: "File mới được chia sẻ",
    desc: "report-q2.pdf bởi Đức Minh",
    time: "Hôm qua",
  },
];

export const initialMessages: Record<string, Message[]> = {
  f1: [
    {
      id: "m1",
      from: "them",
      author: "Mai Linh",
      text: "Chào bạn, mình vừa gửi báo cáo qua mail nhé!",
      time: "09:40",
    },
    {
      id: "m2",
      from: "me",
      text: "Ok bạn, để mình xem qua rồi feedback sau.",
      time: "09:41",
    },
    {
      id: "m3",
      from: "them",
      author: "Mai Linh",
      text: "Tuyệt vời, có gì cần chỉnh thì cứ nhắn mình nhe 🙌",
      time: "09:42",
    },
  ],
  g1: [
    {
      id: "m1",
      from: "them",
      author: "Hoàng Anh",
      text: "Mọi người chuẩn bị cho demo sprint chiều nay nhé.",
      time: "09:55",
    },
    {
      id: "m2",
      from: "them",
      author: "Phương Vy",
      text: "Mình sẽ trình bày phần UI mới.",
      time: "09:58",
    },
    { id: "m3", from: "me", text: "Ok, mình lo phần backend.", time: "10:00" },
    {
      id: "m4",
      from: "them",
      author: "Mai Linh",
      text: "Demo sprint chiều nay lúc 15:00 nhé cả nhà.",
      time: "10:02",
    },
  ],
};
