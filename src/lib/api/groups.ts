import axiosClient from "./axiosClient";

/**
 * Tạo nhóm mới
 */
export async function createGroupApi(body: any): Promise<any> {
  const { data } = await axiosClient.post("/groups", body);
  return data;
}

/**
 * Cập nhật thông tin nhóm
 */
export async function updateGroupApi(groupId: string, body: any): Promise<any> {
  const { data } = await axiosClient.put(`/groups/${groupId}`, body);
  return data;
}

/**
 * Xóa/giải tán nhóm
 */
export async function deleteGroupApi(groupId: string): Promise<any> {
  const { data } = await axiosClient.delete(`/groups/${groupId}`);
  return data;
}
