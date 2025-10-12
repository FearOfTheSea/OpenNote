import { InMemoryNoteRepository } from "./infrastructure/repositories/InMemoryNoteRepository.ts";

const env = Deno.env.get("NODE_ENV") || "development";

let noteRepository;

// Switch repository types based on environment
switch (env) {
  case "test":
    noteRepository = new InMemoryNoteRepository(); // Maybe change this to a mocked database
    break;
  case "production":
    noteRepository = new InMemoryNoteRepository(); // Change this to real database
    break;
  case "development":
  default:
    noteRepository = new InMemoryNoteRepository();
    break;
}

export { noteRepository };
