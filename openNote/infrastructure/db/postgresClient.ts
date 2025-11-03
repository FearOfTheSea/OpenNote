import { Client } from "pg";
import { load } from "dotenv";

await load({ export: true });

const env = Deno.env.get("NODE_ENV") || "development";

let client: Client;

if (env === "production") {
    client = new Client({
        hostname: Deno.env.get("DB_HOST"),
        port: Number(Deno.env.get("DB_PORT")),
        user: Deno.env.get("DB_USER"),
        password: Deno.env.get("DB_PASSWORD"),
        database: Deno.env.get("DB_NAME"),
    });

    await client.connect();
    console.log("🐘 Connected to PostgreSQL database!");
} else {
    // Create a dummy client for non-production environments
    client = null as any;
    console.log("📝 Running in " + env + " mode with in-memory database");
}

export default client;