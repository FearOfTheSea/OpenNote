import { InMemoryNoteRepository } from "./infrastructure/repositories/InMemoryNoteRepository.ts";
import { InMemoryFolderRepository } from "./infrastructure/repositories/InMemoryFolderRepository.ts";
import { InMemoryTagRepository } from "./infrastructure/repositories/InMemoryTagRepository.ts";
import { FolderRepository } from "./application/repositories/FolderRepository.ts";
import { TagRepository } from "./application/repositories/TagRepository.ts";
import { NoteRepository } from "./application/repositories/NoteRepository.ts";

const env = Deno.env.get("NODE_ENV") || "development";

let noteRepository: NoteRepository;
let folderRepository: FolderRepository;
let tagRepository: TagRepository;

// Switch repository types based on environment
switch (env) {
    case "test":
        folderRepository = new InMemoryFolderRepository();
        noteRepository = new InMemoryNoteRepository(folderRepository);
        tagRepository = new InMemoryTagRepository();
        break;
    case "production":
        // Change these to real database implementations
        folderRepository = new InMemoryFolderRepository();
        noteRepository = new InMemoryNoteRepository(folderRepository);
        tagRepository = new InMemoryTagRepository();
        break;
    case "development":
    default:
        folderRepository = new InMemoryFolderRepository();
        noteRepository = new InMemoryNoteRepository(folderRepository);
        tagRepository = new InMemoryTagRepository();
        break;
}

export { folderRepository, noteRepository, tagRepository };
