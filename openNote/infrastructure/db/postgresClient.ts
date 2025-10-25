import { Client } from "pg";
import { load } from "dotenv";

await load({ export: true });

const client = new Client({
    hostname: Deno.env.get("DB_HOST"),
    port: Number(Deno.env.get("DB_PORT")),
    user: Deno.env.get("DB_USER"),
    password: Deno.env.get("DB_PASSWORD"),
    database: Deno.env.get("DB_NAME"),
});

// await client.connect();

console.log("🐘 Connected to PostgreSQL database!");

export default client;
