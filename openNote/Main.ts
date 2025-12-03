import { createServer } from "./Server.ts";

const port = Number(Deno.env.get("PORT") ?? "3300");

const app = await createServer({
  seedMockData: false,
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
