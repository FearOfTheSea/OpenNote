import { Pool } from "pg";

let pool: Pool | null = null;

function createPool(): Pool {
  console.log("[POSTGRES] POOL INITIALIZED");
  return new Pool(
    {
      hostname: Deno.env.get("DB_HOST"),
      port: Number(Deno.env.get("DB_PORT")),
      user: Deno.env.get("DB_USER"),
      password: Deno.env.get("DB_PASSWORD"),
      database: Deno.env.get("DB_NAME"),
    },
    49,
  );
}

// Export getter instead of pool object so that postgres
// connection is not established in other environments
export async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = createPool();
    const client = await pool.connect();
    console.log("[POSTGRES] Connected to PostgreSQL via pool!");
    client.release();
  }
  return pool;
}
