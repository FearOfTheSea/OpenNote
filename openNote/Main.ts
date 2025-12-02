import { createServer } from "./Server.ts";

const port = Number(Deno.env.get("PORT") ?? "3000");

const app = await createServer({
  seedMockData: true,
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
