import { createClient } from "redis";
import { RetryExecutor } from "../resilience/RetryExecutor.ts";

const redisHost = Deno.env.get("REDIS_HOST") ?? "127.0.0.1";
const redisPort = Number(Deno.env.get("REDIS_PORT") ?? "6379");

export const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
});

redisClient.on("error", (err) => {
  console.error("[REDIS] Client error:", err);
});

export async function initRedis(): Promise<void> {
  await RetryExecutor.execute(
    "Connect to Redis",
    async () => {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
    },
    { maxRetries: 10, initialDelay: 500 }
  );

  console.log(`[REDIS] Connected to redis at ${redisHost}:${redisPort}`);
}

export async function closeRedis(): Promise<void> {
  if (!redisClient.isOpen) return;
  await redisClient.quit();
  console.log("[REDIS] Redis client closed");
}
