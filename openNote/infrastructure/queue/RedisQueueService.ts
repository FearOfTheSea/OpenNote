import { connect, Redis } from "https://deno.land/x/redis@v0.32.1/mod.ts";
import { IQueueService } from "../../application/ports/IQueueService.ts";

export class RedisQueueService implements IQueueService {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor(
    private host: string,
    private port: number
  ) {}

  private async getClient(): Promise<Redis> {
    if (!this.isConnected || !this.redis) {
      this.redis = await connect({ hostname: this.host, port: this.port });
      this.isConnected = true;
      console.log("[QUEUE] Redis Connected");
    }
    return this.redis;
  }

  async enqueue(queueName: string, payload: any): Promise<void> {
    const client = await this.getClient();
    // LPUSH: Đẩy vào đầu danh sách
    await client.lpush(queueName, JSON.stringify(payload));
  }

  async dequeueReliable(
    queueName: string,
    processingQueueName: string
  ): Promise<{ data: any; raw: string } | null> {
    const client = await this.getClient();

    // BRPOPLPUSH source destination timeout
    // 1. Lấy phần tử cuối cùng của 'queueName'
    // 2. Đẩy nó vào đầu 'processingQueueName'
    // 3. Trả về phần tử đó.
    // Thao tác này là ATOMIC (Nguyên tử). Không thể bị ngắt giữa chừng.
    // [FIX]: Đổi timeout từ 0 sang 1 (giây)
    // Nghĩa là: "Thử lấy trong 1s, nếu không có thì trả về null để worker đi làm việc khác"
    const rawData = await client.brpoplpush(queueName, processingQueueName, 1); // 0 = Chờ vô hạn

    if (rawData) {
      return { data: JSON.parse(rawData), raw: rawData };
    }
    return null;
  }

  async acknowledge(
    processingQueueName: string,
    rawData: string
  ): Promise<void> {
    const client = await this.getClient();
    // LREM: Xóa job khỏi hàng đợi đang xử lý -> Xác nhận hoàn tất
    await client.lrem(processingQueueName, 1, rawData);
  }

  async recover(queueName: string, processingQueueName: string): Promise<void> {
    const client = await this.getClient();
    console.log(
      `[QUEUE] Checking for orphaned jobs in ${processingQueueName}...`
    );

    while (true) {
      // rpoplpush trả về Bulk (string | null | ...)
      const item = await client.rpoplpush(processingQueueName, queueName);

      // Kiểm tra nếu item là null hoặc undefined -> Hết job -> Thoát
      if (!item) {
        break;
      }

      // Ép kiểu về string để log (nếu item tồn tại, nó chắc chắn là chuỗi JSON)
      const itemStr = String(item);
      console.log(`[QUEUE RECOVERY] Restored job:`, itemStr);
    }
  }

  close() {
    if (this.redis) this.redis.close();
  }
}
