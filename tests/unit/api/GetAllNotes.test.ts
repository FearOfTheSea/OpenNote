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

type ResponseData = NoteDTO[];

Deno.test("[GET /api/notes] Return notes of a user with tags filtering", async () => {
  const mockedUserId = "d1e931d0-24bd-43d4-a3b7-61594efc909c";

  const app = await createServer({
    seedMockData: true,
    mockUserId: mockedUserId,
  });

  const port = 7000;
  const server = app.listen(port);

  try {
    const res = await fetch(
      `http://localhost:${port}/api/notes?user_id=${mockedUserId}`,
    );

    if (!res.ok) {
      throw new Error("[ERROR] /api/notes: FETCH FAILED");
    }

    const data: ResponseData = await res.json();
    assertEquals(data[0].name, "f1note1", "Note name mismatch!");
    assertEquals(data[1].name, "f1note2", "Note name mismatch!");
    assertEquals(data[2].name, "f1note3", "Note name mismatch!");
    assertEquals(data[3].name, "f2note1", "Note name mismatch!");
    assertEquals(data[4].name, "f2note2", "Note name mismatch!");
    assertEquals(data[5].name, "f2note3", "Note name mismatch!");
    assertEquals(data[6].name, "f3note1", "Note name mismatch!");
    assertEquals(data[7].name, "f3note2", "Note name mismatch!");
    assertEquals(data[8].name, "f3note3", "Note name mismatch!");
    assertEquals(data[9].name, "sf3note1", "Note name mismatch!");
    assertEquals(data[10].name, "sf3note2", "Note name mismatch!");
    assertEquals(data[11].name, "sf3note3", "Note name mismatch!");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err?: Error) => (err ? reject(err) : resolve()));
    });
  }
});
