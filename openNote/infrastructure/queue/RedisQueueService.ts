import { redisClient } from "../redis/RedisClient.ts";
import { IQueueService } from "../../application/ports/IQueueService.ts";

export class RedisQueueService implements IQueueService {
  constructor(
    private visibilityTimeoutSec = 60 // timeout job stuck
  ) {}

  private getVisibilityKey(processingQueueName: string, raw: string) {
    return `vt:${processingQueueName}:${raw}`;
  }

  async enqueue(queueName: string, payload: any): Promise<void> {
    await redisClient.lPush(queueName, JSON.stringify(payload));
  }

  async dequeueReliable(
    queueName: string,
    processingQueueName: string
  ): Promise<{ data: any; raw: string } | null> {
    const raw = await redisClient.brPopLPush(queueName, processingQueueName, 1);
    if (!raw) return null;

    // set visibility timeout timestamp
    const vtKey = this.getVisibilityKey(processingQueueName, raw);
    await redisClient.set(vtKey, Date.now().toString(), {
      EX: this.visibilityTimeoutSec,
    });

    return {
      data: JSON.parse(raw),
      raw,
    };
  }

  async acknowledge(
    processingQueueName: string,
    rawData: string
  ): Promise<void> {
    const vtKey = this.getVisibilityKey(processingQueueName, rawData);

    // remove from processing queue
    await redisClient.lRem(processingQueueName, 1, rawData);

    // remove visibility timeout
    await redisClient.del(vtKey);
  }

  /**
   * Check all jobs inside processingQueue
   * If timestamp expired, then requeue back to main queue
   */
  async recover(queueName: string, processingQueueName: string): Promise<void> {
    console.log(
      `[QUEUE] Running visibility-timeout recovery on ${processingQueueName}...`
    );

    while (true) {
      // peek oldest job
      const raw = await redisClient.lIndex(processingQueueName, -1);
      if (!raw) break;

      const vtKey = this.getVisibilityKey(processingQueueName, raw);
      const timestampStr = await redisClient.get(vtKey);

      // job không có timestamp nghĩa là worker crash sau khi lấy job nhưng chưa set key
      if (!timestampStr) {
        console.log(`[QUEUE RECOVERY] Job missing vt-key → requeue: ${raw}`);

        // move job back to main queue
        await redisClient.rPopLPush(processingQueueName, queueName);

        // đảm bảo không còn vtKey
        await redisClient.del(vtKey);
        continue;
      }

      const timestamp = Number(timestampStr);
      const elapsed = Date.now() - timestamp;

      if (elapsed > this.visibilityTimeoutSec * 1000) {
        console.log(
          `[QUEUE RECOVERY] Visibility timeout → requeue job: ${raw}`
        );

        // move job back
        await redisClient.rPopLPush(processingQueueName, queueName);

        // delete vt key
        await redisClient.del(vtKey);
      } else {
        // job chưa timeout thì không xử lý tiếp
        break;
      }
    }
  }
}
