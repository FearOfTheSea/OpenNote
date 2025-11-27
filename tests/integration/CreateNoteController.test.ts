import {
  CreateNoteController,
  CreateNoteRequest,
  CreateNoteResponse,
} from "../../openNote/interface/controllers/note/CreateNoteController.ts";
import { InMemoryNoteRepository } from "../../openNote/infrastructure/repositories/InMemoryNoteRepository.ts";
import { assertEquals } from "@std/assert";

Deno.test("[CreateNoteController] Create new note test", async () => {
  const repository = new InMemoryNoteRepository();

  const controller = new CreateNoteController(repository);
  const request: CreateNoteRequest = {
    name: "",
    content: "deadline coming at 13/10",
    folderId: "726e6",
    tagsId: ["8fhr4", "7r6f"],
  };
  const response: CreateNoteResponse = await controller.apply(request);

  assertEquals(response != null, true, "Create note response must not be null");
});
