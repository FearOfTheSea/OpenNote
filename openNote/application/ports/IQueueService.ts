export interface IQueueService {
  /**
   * Producer: Đẩy job vào hàng đợi chính
   */
  enqueue(queueName: string, payload: any): Promise<void>;

  /**
   * Consumer: Lấy job từ queueName và đẩy sang processingQueueName một cách nguyên tử (Atomic).
   * Nếu Worker chết lúc này, job vẫn nằm ở processingQueueName.
   */
  dequeueReliable(
    queueName: string,
    processingQueueName: string,
  ): Promise<{ data: any; raw: string } | null>;

  /**
   * Consumer: Xác nhận job đã xong -> Xóa khỏi processingQueueName
   */
  acknowledge(processingQueueName: string, rawData: string): Promise<void>;

  /**
   * System: Khôi phục các job bị kẹt do Worker chết (Crash Recovery)
   */
  recover(queueName: string, processingQueueName: string): Promise<void>;
}
