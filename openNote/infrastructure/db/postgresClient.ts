import { Client } from "pg";

const env = Deno.env.get("NODE_ENV") || "development";

console.log("[POSTGRES CLIENT] CLIENT INITIALIZED");

const client = new Client({
  hostname: Deno.env.get("DB_HOST"),
  port: Number(Deno.env.get("DB_PORT")),
  user: Deno.env.get("DB_USER"),
  password: Deno.env.get("DB_PASSWORD"),
  database: Deno.env.get("DB_NAME"),
});

if (env === "production") {
  await client.connect();
  console.log("🐘 Connected to PostgreSQL database!");
}

export default client;
