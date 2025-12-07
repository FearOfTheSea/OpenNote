import { Pool } from "pg";
import { RetryExecutor } from "../resilience/RetryExecutor.ts";
import { Logger } from "../utils/Logger.ts";

let pool: Pool | null = null;

/**
 * Create a new PostgreSQL connection pool
 */
function createPool(): Pool {
  console.log("[POSTGRES] Initializing pool...");
  console.log("DB_HOST =", Deno.env.get("DB_HOST"));
  console.log(`[POSTGRES CONFIG] Connecting to`, Deno.env.get("DB_PORT"));

  const newPool = new Pool(
    {
      hostname: Deno.env.get("DB_HOST"),
      port: Number(Deno.env.get("DB_PORT")),
      user: Deno.env.get("DB_USER"),
      password: Deno.env.get("DB_PASSWORD"),
      database: Deno.env.get("DB_NAME"),
    },
    40,
    // lazy connection, không connect tới db ngay lúc new Pool
    true
  );

  return newPool;
}

/**
 * Ensures PostgreSQL is ready before API starts.
 * Uses retries with exponential backoff.
 */
export async function waitForDatabase(): Promise<void> {
  await RetryExecutor.execute(
    "Connect to PostgreSQL",
    async () => {
      const p = await getPool(); // pool đảm bảo init ở đây
      const client = await p.connect();
      try {
        await client.queryObject("SELECT 1");
        console.log("PostgreSQL ready!");
      } finally {
        client.release();
      }
    },
    { maxRetries: 10, initialDelay: 1000 } // thử lại tối đa 10 lần, bắt đầu với delay 1s
  ).catch((err: any) => {
    Logger.warn(
      "[POSTGRES] Warm-up failed. Will retry on request. Error:",
      err
    );
  });
}

/**
 * Lazily initializes the PG pool — only when needed.
 */
export async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = createPool();
    console.log("[POSTGRES] Pool created.");
  }

  return pool;
}

// health check monitor
// return true if db is still ok
export async function checkDatabaseHealth(): Promise<boolean> {
  if (!pool) {
    return false;
  }

  try {
    const checkPromise = async () => {
      const client = await pool!.connect();
      try {
        await client.queryObject("SELECT 1");
        return true;
      } finally {
        client.release();
      }
    };

    const timeoutPromise = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error("Health check timeout")), 2000)
    );

    await Promise.race([checkPromise(), timeoutPromise]);
    return true;
  } catch (error) {
    Logger.error("[HEALTH] Database check failed", error);
    // chủ động reset pool để thử lại
    await closeDbPool();
    return false;
  }
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    const tempPool = pool;
    pool = null; // set null để request sau tạo pool mới
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Force close timeout")), 500)
      );
      await Promise.race([tempPool.end(), timeoutPromise]);
      Logger.info("[POSTGRES] Pool closed.");
    } catch (error) {
      Logger.warn("Error while closing dead pool: ${error}");
    }
  }
}
