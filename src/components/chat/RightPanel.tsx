import { X, UserPlus, Edit3, BellOff, Ban, Shield, Trash2, FileText } from "lucide-react";
import type { Conversation } from "./types";
import { Avatar, QuickAction, SectionLabel } from "./ui-primitives";

interface RightPanelProps {
  active: Conversation;
  onClose: () => void;
}

export function RightPanel({ active, onClose }: RightPanelProps) {
  const isGroup = active.type === "group";

  return (
    <aside className="w-80 shrink-0 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col">
      {/* Panel header */}
      <div className="h-16 px-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold">
          {isGroup ? "Thông tin nhóm" : "Thông tin liên hệ"}
        </h3>
        <button
          onClick={onClose}
          aria-label="Đóng bảng thông tin"
          className="h-8 w-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile section */}
        <div className="px-5 py-6 flex flex-col items-center text-center border-b border-neutral-200 dark:border-neutral-800">
          <Avatar initials={active.avatar} size="lg" gradient />
          <h4 className="mt-3 text-base font-semibold">{active.name}</h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {isGroup ? `${active.members?.length ?? 0} thành viên` : "Phòng Sản phẩm • Online"}
          </p>

          {/* Quick actions */}
          <div className="mt-4 flex items-center gap-2">
            {isGroup ? (
              <>
                <QuickAction icon={<UserPlus size={16} />} label="Thêm" />
                <QuickAction icon={<Edit3 size={16} />} label="Đổi tên" />
                <QuickAction icon={<BellOff size={16} />} label="Tắt TB" />
              </>
            ) : (
              <>
                <QuickAction icon={<BellOff size={16} />} label="Tắt TB" />
                <QuickAction icon={<Ban size={16} />} label="Chặn" danger />
              </>
            )}
          </div>
        </div>

        {/* Members list (groups only) */}
        {isGroup && active.members && active.members.length > 0 && (
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <SectionLabel
              count={active.members.length}
              action={{
                label: "Xem tất cả",
                onClick: () => {},
              }}
            >
              Thành viên
            </SectionLabel>
            <ul className="space-y-1">
              {active.members.map((m) => (
                <li
                  key={m.name}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold shrink-0">
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    {m.role && (
                      <p className="text-[11px] text-indigo-500 flex items-center gap-1">
                        <Shield size={10} />
                        {m.role}
                      </p>
                    )}
                  </div>
                  <button
                    aria-label={`Xóa ${m.name}`}
                    className="opacity-0 group-hover:opacity-100 transition text-neutral-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Shared files */}
        <div className="px-5 py-4">
          <SectionLabel action={{ label: "Tất cả", onClick: () => {} }}>
            Tệp đã chia sẻ
          </SectionLabel>
          <ul className="space-y-2">
            {["report-q2.pdf", "mockup-v3.fig", "meeting-notes.docx"].map((file) => (
              <li
                key={file}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file}</p>
                  <p className="text-xs text-neutral-500">2.4 MB</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Photo grid */}
          <div className="mt-5">
            <SectionLabel>Hình ảnh</SectionLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700 hover:opacity-80 transition cursor-pointer"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
