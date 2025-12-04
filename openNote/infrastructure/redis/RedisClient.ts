import { createClient } from "redis";

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
  if (redisClient.isOpen) return;
  await redisClient.connect();
  console.log(`[REDIS] Connected to redis at ${redisHost}:${redisPort}`);
}

export async function closeRedis(): Promise<void> {
  if (!redisClient.isOpen) return;
  await redisClient.quit();
  console.log("[REDIS] Redis client closed");
}
