// @ts-types="npm:@types/express@4.17.15"
import express from "express";
import { CreateNoteController } from "./infrastructure/controllers/CreateNoteController.ts";
import { InMemoryNoteRepository } from "./infrastructure/InMemoryNoteRepository.ts";
import { CreateNoteInput } from "./application/useCases/note/CreateNote.ts";

const app = express();
const port = 3000;

const inMemoryNoteRepository = new InMemoryNoteRepository();
const createNoteController = new CreateNoteController(inMemoryNoteRepository);

app.get("/", async (req, res) => {
  const input: CreateNoteInput = { name: "new note", content: "note content" };
  const output = await createNoteController.apply(
    input,
  );
  // res.send(`Created note: ${output.id}`);
  const allNotes = await inMemoryNoteRepository.findAll();
  res.send(JSON.stringify(allNotes, null, 2));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
