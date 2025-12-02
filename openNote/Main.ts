import { createServer } from "./Server.ts";

const port = Number(Deno.env.get("PORT") ?? "3000");
const mockedUserId = "d1e931d0-24bd-43d4-a3b7-61594efc909c";

const app = await createServer({
  seedMockData: true,
  mockUserId: mockedUserId,
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
