import axiosClient from "./axiosClient";

/**
 * Tạo/Gửi tin nhắn mới
 */
export async function createMessageApi(body: any): Promise<any> {
  const { data } = await axiosClient.post("/messages", body);
  return data;
}

/**
 * Sửa nội dung tin nhắn
 */
export async function updateMessageApi(messageId: string, body: any): Promise<any> {
  const { data } = await axiosClient.put(`/messages/${messageId}`, body);
  return data;
}

/**
 * Thu hồi tin nhắn (cho mọi người)
 */
export async function recallMessageApi(messageId: string): Promise<any> {
  const { data } = await axiosClient.delete(`/messages/${messageId}/recall`);
  return data;
}

/**
 * Ẩn tin nhắn (chỉ với bản thân)
 */
export async function hideMessageApi(messageId: string, channelId: string): Promise<any> {
  const { data } = await axiosClient.post(`/messages/${messageId}/hide`, undefined, {
    params: { channel_id: channelId },
  });
  return data;
}

/**
 * Lấy danh sách tin nhắn trong 1 kênh (hỗ trợ query params)
 */
export async function getChannelMessagesApi(channelId: string, params?: any): Promise<any> {
  const { data } = await axiosClient.get(`/channels/${channelId}/messages`, { params });
  return data;
}

/**
 * Xóa lịch sử chat của 1 kênh
 */
export async function deleteChannelHistoryApi(channelId: string): Promise<any> {
  const { data } = await axiosClient.delete(`/channels/${channelId}/history`);
  return data;
}
