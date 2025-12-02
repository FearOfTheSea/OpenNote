import { assertEquals } from "@std/assert";
import { createServer } from "../../../openNote/Server.ts";

type NoteDTO = {
  readonly id: string;
  readonly name: string;
  readonly content: string;
  readonly parentFolderId: string;
  readonly tagIds: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

type ResponseData = NoteDTO;

Deno.test("[POST /api/notes] Create a new note", async () => {
  const mockedUserId = "d1e931d0-24bd-43d4-a3b7-61594efc909c";

  const app = await createServer({ seedMockData: true, mockUserId: mockedUserId });

  const port = 7000;
  const server = app.listen(port);

  try {
    const res = await fetch(
      `http://localhost:${port}/api/notes`,
      {
        method: "POST",
        body: JSON.stringify({
          name: "new note",
          content: "content of the new note",
          user_id: mockedUserId,
        }),
      },
    );

    if (!res.ok) {
      throw new Error("[ERROR] POST /api/notes: FETCH FAILED");
    }

    const data: ResponseData = await res.json();
    assertEquals(data.name, "new note", "Note name mismatch!");
    assertEquals(data.content, "content of the new note", "Note name mismatch!");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err?: Error) => (err ? reject(err) : resolve()));
    });
  }
});
