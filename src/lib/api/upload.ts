import axiosClient from "./axiosClient";

export interface GeneratePresignedUrlReq {
  object_name: string;
  content_type?: string;
  folder?: string;
}

/**
 * Tạo presigned URL để upload file lên MinIO
 */
export async function generatePresignedUrlApi(body: GeneratePresignedUrlReq): Promise<any> {
  const { data } = await axiosClient.post("/upload/presigned", body);
  return data;
}
