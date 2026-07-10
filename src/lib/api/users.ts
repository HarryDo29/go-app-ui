import axiosClient from "./axiosClient";

/**
 * Lấy thông tin user hiện tại (GetMe)
 */
export async function getMeApi(): Promise<any> {
  const { data } = await axiosClient.get("/user");
  return data;
}

/**
 * Lấy thông tin User theo ID
 */
export async function getUserByIdApi(userId: string): Promise<any> {
  const { data } = await axiosClient.get(`/user/me`);
  return data;
}

/**
 * Cập nhật thông tin User
 */
export async function updateUserApi(userId: string, body: any): Promise<any> {
  const { data } = await axiosClient.put(`/user`, body);
  return data;
}

/**
 * Xóa User
 */
export async function deleteUserApi(userId: string): Promise<any> {
  const { data } = await axiosClient.delete(`/user/${userId}`);
  return data;
}

export async function searchUsersApi(name: string): Promise<any> {
  const { data } = await axiosClient.get(`/user/search?name=${name}`);
  return data;
}
