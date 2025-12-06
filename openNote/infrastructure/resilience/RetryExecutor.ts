import { Logger } from "../utils/Logger.ts";

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // Thời gian chờ lần đầu (ms)
  factor?: number; // Hệ số nhân thời gian chờ
  useJitter?: boolean; // sử dụng jitter để tránh bão retry
}

export class RetryExecutor {
  static async execute<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 5;
    const initialDelay = options.initialDelay ?? 1000;
    const factor = options.factor ?? 2;
    const useJitter = options.useJitter ?? false;

    let attempt = 1;
    let delay = initialDelay;

    Logger.debug(`[RETRY-INIT] Starting operation: ${operationName}`, {
      maxRetries,
      initialDelay,
      useJitter,
    });

    while (true) {
      try {
        const result = await operation();

        // thành công sau khi đã từng retry, log info để biết đã phục hồi
        if (attempt > 1) {
          Logger.info(
            `[RETRY-SUCCESS] ${operationName} succeeded after ${attempt - 1} retries.`,
          );
        }

        return result;
      } catch (error) {
        if (attempt > maxRetries) {
          Logger.error(
            `[RETRY-FAIL] ${operationName} FAILED permanently after ${attempt - 1} retries.`,
            error,
          );
          throw error;
        }

        // Tính toán thời gian chờ với jitter nếu được bật
        let actualDelay = delay;
        if (useJitter) {
          const jitter = Math.random() * delay * 0.5;
          actualDelay = delay / 2 + jitter;
        }

        Logger.warn(
          `[RETRY-WAIT] ${operationName} failed (Attempt ${attempt}/${maxRetries}). Waiting ${actualDelay}ms...`,
          { error: (error as Error).message, actualDelay },
        );

        await new Promise((resolve) => setTimeout(resolve, actualDelay));

        // Backoff exponential
        delay *= factor;
        attempt++;
      }
    }
  }
}
