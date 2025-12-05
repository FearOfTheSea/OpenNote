import { Pool } from "pg";
import { RetryExecutor } from "../resilience/RetryExecutor.ts";

let pool: Pool | null = null;

/**
 * Create a new PostgreSQL connection pool
 */
function createPool(): Pool {
  console.log("[POSTGRES] Initializing pool...");

  return new Pool(
    {
      hostname: Deno.env.get("DB_HOST"),
      port: Number(Deno.env.get("DB_PORT")),
      user: Deno.env.get("DB_USER"),
      password: Deno.env.get("DB_PASSWORD"),
      database: Deno.env.get("DB_NAME"),
    },
    20
  );
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
    { maxRetries: 10, initialDelay: 2000 } // thử lại tối đa 10 lần, bắt đầu với delay 2s
  );
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
