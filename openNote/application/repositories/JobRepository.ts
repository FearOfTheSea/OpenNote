export interface JobRepository {
  // Tạo job mới khi controller nhận request
  create(userId: string, type: string): Promise<string>; // Trả về jobId

  // Cập nhật trạng thái và kết quả cung cấp cho worker gọi
  updateStatus(
    jobId: string,
    status: string,
    resultUrl?: string,
    errorMessage?: string
  ): Promise<void>;

  // Lấy trạng thái (Frontend gọi để Polling)
  findById(
    jobId: string
  ): Promise<{ status: string; resultUrl?: string | null }>;
}
