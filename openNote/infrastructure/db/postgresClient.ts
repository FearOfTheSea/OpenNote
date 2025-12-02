import { Pool } from "pg";

const env = Deno.env.get("NODE_ENV") ?? "development";

console.log("[POSTGRES] POOL INITIALIZED");

const pool = new Pool(
  {
    hostname: Deno.env.get("DB_HOST"),
    port: Number(Deno.env.get("DB_PORT")),
    user: Deno.env.get("DB_USER"),
    password: Deno.env.get("DB_PASSWORD"),
    database: Deno.env.get("DB_NAME"),
  },
  10 // max connections
);

if (env === "production") {
  // Test connection
  const client = await pool.connect();
  console.log("🐘 Connected to PostgreSQL via pool!");
  client.release();
}

export default pool;
