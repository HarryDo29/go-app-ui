import axiosClient from "./axiosClient";

// ── Channel Base ──────────────────────────────────────────────────────────

/**
 * Lấy danh sách các kênh của user
 */
export async function getUserChannelsApi(type?: string): Promise<any> {
  const { data } = await axiosClient.get(`/channels`, {
    params: type ? { type } : undefined,
  });
  return data;
}

/**
 * Cập nhật thông tin kênh
 */
export async function updateChannelApi(channelId: string, body: any): Promise<any> {
  const { data } = await axiosClient.put(`/channels/${channelId}`, body);
  return data;
}

/**
 * Xóa kênh
 */
export async function deleteChannelApi(channelId: string): Promise<any> {
  const { data } = await axiosClient.delete(`/channels/${channelId}`);
  return data;
}

// ── Channel Members ───────────────────────────────────────────────────────

/**
 * Thêm member vào kênh
 */
export async function addChannelMemberApi(body: any): Promise<any> {
  const { data } = await axiosClient.post("/channels/members", body);
  return data;
}

/**
 * Xóa/Kick member khỏi kênh
 */
export async function removeChannelMemberApi(memberId: string): Promise<any> {
  const { data } = await axiosClient.delete(`/channels/members/${memberId}`);
  return data;
}

/**
 * Lấy danh sách member của kênh
 */
export async function getChannelMembersApi(channelId: string): Promise<any> {
  const { data } = await axiosClient.get(`/channels/${channelId}/members`);
  return data;
}

/**
 * Đếm số lượng member trong kênh
 */
export async function getChannelMembersCountApi(channelId: string): Promise<any> {
  const { data } = await axiosClient.get(`/channels/${channelId}/members/count`);
  return data;
}

// ── Channel Unreads ───────────────────────────────────────────────────────

/**
 * Lấy số lượng tin nhắn chưa đọc của user
 */
export async function getUserUnreadsApi(userId: string): Promise<any> {
  const { data } = await axiosClient.get(`/channels/unreads/user/${userId}`);
  return data;
}

/**
 * Cập nhật trạng thái đã đọc
 */
export async function updateUnreadApi(unreadId: string, body: any): Promise<any> {
  const { data } = await axiosClient.put(`/channels/unreads/${unreadId}`, body);
  return data;
}

/**
 * Xóa record unread
 */
export async function deleteUnreadApi(unreadId: string): Promise<any> {
  const { data } = await axiosClient.delete(`/channels/unreads/${unreadId}`);
  return data;
}
