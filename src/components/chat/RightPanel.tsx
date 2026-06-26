import { useState } from "react";
import { X, UserPlus, Edit3, BellOff, Ban, FileText, Shield, Trash2, Search } from "lucide-react";
import type { Conversation } from "./types";
import { Avatar, QuickAction, SectionLabel } from "./ui-primitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateGroupApi } from "@/lib/api/groups";
import { addChannelMemberApi, getUserChannelsApi } from "@/lib/api/channels";

interface RightPanelProps {
  active: Conversation;
  onClose: () => void;
  onUpdate?: () => void;
}

export function RightPanel({ active, onClose, onUpdate }: RightPanelProps) {
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const [newGroupName, setNewGroupName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const [friendsList, setFriendsList] = useState<Conversation[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchFriendQuery, setSearchFriendQuery] = useState("");

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

  const handleOpenAddMember = async () => {
    setIsAddMemberOpen(true);
    setIsLoadingFriends(true);
    setSelectedFriendIds([]);
    setSearchFriendQuery("");

    try {
      const { data } = await getUserChannelsApi("direct");
      // Lọc bỏ những bạn bè đã là thành viên trong nhóm
      const existingUserIds = new Set(
        active.group?.members?.map((m) => m.user?.user_id).filter(Boolean) ?? [],
      );
      const filtered = (data || []).filter(
        (c: Conversation) => c.subject?.user_id && !existingUserIds.has(c.subject.user_id),
      );
      setFriendsList(filtered);
    } catch (err) {
      console.error("Lỗi lấy danh sách bạn bè:", err);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleOpenRename = () => {
    setNewGroupName(name);
    setIsRenameOpen(true);
  };

  const handleRenameGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || isRenaming) return;
    setIsRenaming(true);
    try {
      if (active.group?.group_id) {
        await updateGroupApi(active.group.group_id, {
          group_name: newGroupName.trim(),
        });
        setIsRenameOpen(false);
        onUpdate?.();
      }
    } catch (err) {
      console.error("Lỗi đổi tên nhóm:", err);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedFriendIds.length === 0 || isAddingMember) return;
    setIsAddingMember(true);
    try {
      await addChannelMemberApi({
        channel_id: active.channel_id,
        user_ids: selectedFriendIds,
      });
      setIsAddMemberOpen(false);
      setSelectedFriendIds([]);
      onUpdate?.();
    } catch (err) {
      console.error("Lỗi thêm thành viên:", err);
    } finally {
      setIsAddingMember(false);
    }
  };

  const toggleSelectFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId],
    );
  };

  const filteredFriends = friendsList.filter((friend) => {
    if (!friend.subject) return false;
    const q = searchFriendQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      friend.subject.user_name?.toLowerCase().includes(q) ||
      friend.subject.email?.toLowerCase().includes(q)
    );
  });

  return (
    <>
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
            <Avatar initials={initials} size="lg" gradient />
            <h4 className="mt-3 text-base font-semibold">{name}</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isGroup
                ? `${active.group?.member_count ?? 0} thành viên`
                : (active.subject?.email ?? "")}
            </p>

            {/* Quick actions */}
            <div className="mt-4 flex items-center gap-2">
              {isGroup ? (
                <>
                  <QuickAction
                    icon={<UserPlus size={16} />}
                    label="Thêm"
                    onClick={handleOpenAddMember}
                  />
                  <QuickAction
                    icon={<Edit3 size={16} />}
                    label="Đổi tên"
                    onClick={handleOpenRename}
                  />
                  <QuickAction icon={<BellOff size={16} />} label="Tắt TB" onClick={() => {}} />
                </>
              ) : (
                <>
                  <QuickAction icon={<BellOff size={16} />} label="Tắt TB" />
                  <QuickAction icon={<Ban size={16} />} label="Chặn" danger />
                </>
              )}
            </div>
          </div>

          {/* Group info (groups only) */}
          {isGroup && active.group && (
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <SectionLabel
                count={active.group.member_count}
                action={
                  active.group.members && active.group.members.length > 0
                    ? {
                        label: showAllMembers ? "Thu gọn" : "Xem tất cả",
                        onClick: () => setShowAllMembers(!showAllMembers),
                      }
                    : undefined
                }
              >
                Thành viên
              </SectionLabel>
              {active.group.members && active.group.members.length > 0 ? (
                showAllMembers && (
                  <ul className="space-y-1 mt-2">
                    {active.group.members.map((m) => {
                      const user = m.user;
                      const displayName =
                        user?.user_name || user?.email || user?.user_id || "Người dùng";
                      const description = user?.email || user?.user_id;
                      const initials = displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <li
                          key={m.member_id}
                          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition group"
                        >
                          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{displayName}</p>
                            {description && description !== displayName && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                {description}
                              </p>
                            )}
                            {m.role && (
                              <p className="text-[11px] text-primary flex items-center gap-1">
                                <Shield size={10} />
                                {m.role}
                              </p>
                            )}
                          </div>
                          <button
                            aria-label="Xóa"
                            className="opacity-0 group-hover:opacity-100 transition text-neutral-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )
              ) : (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-4">
                  Chưa có dữ liệu thành viên
                </p>
              )}
            </div>
          )}

          {/* Friend info (dm only) */}
          {!isGroup && active.subject && (
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
              <SectionLabel>Thông tin</SectionLabel>
              <div className="text-sm text-neutral-600 dark:text-neutral-300 space-y-1.5">
                <p>
                  <span className="text-neutral-400 dark:text-neutral-500 text-xs">Email</span>
                  <br />
                  {active.subject.email}
                </p>
                <p>
                  <span className="text-neutral-400 dark:text-neutral-500 text-xs">Vai trò</span>
                  <br />
                  {active.subject.role}
                </p>
              </div>
            </div>
          )}

          {/* Shared files */}
          <div className="px-5 py-4">
            <SectionLabel>Tệp đã chia sẻ</SectionLabel>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <FileText size={24} className="text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Chưa có tệp nào được chia sẻ
              </p>
            </div>

            {/* Photo grid */}
            <div className="mt-5">
              <SectionLabel>Hình ảnh</SectionLabel>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  Chưa có hình ảnh nào
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Modal Thêm thành viên */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thêm thành viên</DialogTitle>
            <DialogDescription>
              Chọn bạn bè từ danh sách để thêm vào nhóm <strong>{name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Thanh tìm kiếm */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Tìm kiếm bạn bè..."
                value={searchFriendQuery}
                onChange={(e) => setSearchFriendQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-neutral-400 transition"
              />
            </div>

            {/* Danh sách bạn bè có thể thêm */}
            <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 border border-neutral-100 dark:border-neutral-800 rounded-lg p-2 bg-neutral-50/50 dark:bg-neutral-900/30">
              {isLoadingFriends ? (
                <div className="text-center text-xs text-neutral-400 py-6">
                  Đang tải danh sách bạn bè...
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center text-xs text-neutral-400 py-6">
                  {searchFriendQuery.trim()
                    ? "Không tìm thấy bạn bè phù hợp"
                    : "Tất cả bạn bè đã ở trong nhóm"}
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const isChecked = selectedFriendIds.includes(friend.subject.user_id);
                  const fName = friend.subject.user_name || friend.subject.email;
                  const fInitials = fName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <label
                      key={friend.subject.user_id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 cursor-pointer transition select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectFriend(friend.subject.user_id)}
                        className="rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary h-4 w-4 bg-transparent"
                      />
                      <Avatar initials={fInitials} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{fName}</p>
                        <p className="text-xs text-neutral-500 truncate">{friend.subject.email}</p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Hiển thị số lượng đã chọn */}
            {selectedFriendIds.length > 0 && (
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Đã chọn <strong className="text-primary">{selectedFriendIds.length}</strong> thành
                viên
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddMemberOpen(false);
                setSelectedFriendIds([]);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={selectedFriendIds.length === 0 || isAddingMember}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isAddingMember ? "Đang thêm..." : "Thêm vào nhóm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Đổi tên nhóm */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleRenameGroup}>
            <DialogHeader>
              <DialogTitle>Đổi tên nhóm</DialogTitle>
              <DialogDescription>
                Nhập tên mới cho nhóm trò chuyện này. Tên mới sẽ hiển thị với tất cả thành viên.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="rename-group-name" className="text-sm font-medium">
                  Tên nhóm mới
                </label>
                <Input
                  id="rename-group-name"
                  placeholder="VD: Dự án Alpha..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsRenameOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={!newGroupName.trim() || isRenaming}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isRenaming ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
