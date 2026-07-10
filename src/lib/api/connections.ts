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
export async function getUserConnectionsApi(status: string): Promise<any> {
  const { data } = await axiosClient.get(`/connections/user?status=${status}`);
  return data;
}

/**
 * Phản hồi connection (accept / reject)
 */
export async function respondConnectionApi(
  connectionId: string,
  status: "ACCEPTED" | "REJECTED",
): Promise<any> {
  const { data } = await axiosClient.put(`/connections/${connectionId}/respond?status=${status}`);
  return data;
}

/**
 * Xóa / Hủy connection
 */
export async function deleteConnectionApi(connectionId: string): Promise<any> {
  const { data } = await axiosClient.delete(`/connections/${connectionId}`);
  return data;
}
