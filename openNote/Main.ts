// @ts-types="npm:@types/express@4.17.15"
import express from "express";
import { noteRepository } from "./ApplicationContext.ts";
import { CreateNoteController } from "./interface/controllers/CreateNoteController.ts";
import { CreateNoteInput } from "./application/useCases/note/CreateNote.ts";

const app = express();
app.use(express.json());

const port = 3000;
const createNoteController = new CreateNoteController(noteRepository);

app.get("/notes", async (req, res) => {
  const allNotes = await noteRepository.findAll();
  res.send(JSON.stringify(allNotes, null, 2));
});

app.get("/note/:id", async (req, res) => {
  const foundNote = await noteRepository.findById(req.params.id);
  if (!foundNote) {
    res.sendStatus(404);
  } else {
    res.send(JSON.stringify(foundNote));
  }
});

app.post("/note", async (req, res) => {
  const createNoteInput: CreateNoteInput = {
    name: req.body.name,
    content: req.body.content,
  };
  const createNoteOutput = await createNoteController.apply(createNoteInput);
  res.send(`Created note: ${JSON.stringify(createNoteOutput)}`);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
