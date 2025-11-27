import { ClientPostgreSQL, NessieConfig } from "nessie";
import { load } from "@std/dotenv";

await load({ export: true });

const config: NessieConfig = {
  client: new ClientPostgreSQL({
    hostname: Deno.env.get("DB_HOST"),
    port: Number(Deno.env.get("DB_PORT")),
    user: Deno.env.get("DB_USER"),
    password: Deno.env.get("DB_PASSWORD"),
    database: Deno.env.get("DB_NAME"),
  }),
  migrationFolders: ["./openNote/infrastructure/db/migrations"],
  seedFolders: ["./openNote/infrastructure/db/seed"],
  debug: true,
};

export default config;
