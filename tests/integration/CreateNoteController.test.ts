import {CreateNoteController} from "../../openNote/interface/controllers/CreateNoteController.ts";
import {InMemoryNoteRepository} from "../../openNote/infrastructure/InMemoryNoteRepository.ts";
import {CreateNoteInput, CreateNoteOutput} from "../../openNote/application/useCases/note/CreateNote.ts";
import { assertEquals } from "@std/assert";

Deno.test('CreateNoteController should create a note', async () => {
    const repository = new InMemoryNoteRepository();

    const createNoteInput: CreateNoteInput = {name: "new note", content: "lma"};
    const createNoteController = new CreateNoteController(repository);
    const createNoteOutput: CreateNoteOutput = await createNoteController.apply(createNoteInput);

    console.log(createNoteOutput.id);
    const foundNote = await repository.findById(createNoteOutput.id);
    if (foundNote) {
        console.log(foundNote.name, foundNote.content, foundNote.folderId, foundNote.tagsId);
    }

    assertEquals(createNoteOutput.id != null, true, "Note ID should be defined");
});
