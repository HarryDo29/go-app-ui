import axiosClient from "./axiosClient";

/**
 * Tạo connection / Yêu cầu kết bạn
 */
export async function createConnectionApi(body: any): Promise<any> {
  const { data } = await axiosClient.post("/connections", body);
  return data;
}

/**
 * Lấy chi tiết connection dựa trên participants
 */
export async function getConnectionDetailApi(body: any): Promise<any> {
  const { data } = await axiosClient.post("/connections/detail", body);
  return data;
}

/**
 * Lấy connection theo user ID
 */
export async function getUserConnectionsApi(userId: string): Promise<any> {
  const { data } = await axiosClient.get(`/connections/${userId}`);
  return data;
}

/**
 * Chấp nhận connection
 */
export async function acceptConnectionApi(connectionId: string, body?: any): Promise<any> {
  const { data } = await axiosClient.put(`/connections/${connectionId}/accept`, body);
  return data;
}

/**
 * Xóa / Hủy connection
 */
export async function deleteConnectionApi(connectionId: string): Promise<any> {
  const { data } = await axiosClient.delete(`/connections/${connectionId}`);
  return data;
}
