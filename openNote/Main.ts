import { createServer } from "./api/Server.ts";
import { waitForDatabase } from "./infrastructure/db/postgresClient.ts";

const port = Number(Deno.env.get("PORT") ?? "3300");

// wait for server to be ready
try {
  await waitForDatabase();
} catch (error) {
  console.error("Failed to connect to the database:", error);
  Deno.exit(1);
}

const app = await createServer({
  seedMockData: false,
});

app.listen(port, () => {
  console.log(`[EXPRESS APP] Server running at http://localhost:${port}`);
});
