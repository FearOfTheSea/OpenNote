import { InMemoryNoteRepository } from "./infrastructure/repositories/InMemoryNoteRepository.ts";
import { InMemoryFolderRepository } from "./infrastructure/repositories/InMemoryFolderRepository.ts";
import { InMemoryTagRepository } from "./infrastructure/repositories/InMemoryTagRepository.ts";
import { FolderRepository } from "./application/repositories/FolderRepository.ts";
import { TagRepository } from "./application/repositories/TagRepository.ts";
import { NoteRepository } from "./application/repositories/NoteRepository.ts";
import { PostgreNoteRepository } from "./infrastructure/repositories/PostgreNoteRepository.ts";
import { PostgreFolderRepository } from "./infrastructure/repositories/PostgreFolderRepository.ts";
import { PostgreTagRepository } from "./infrastructure/repositories/PostgreTagRepository.ts";
import { PostgreUnitOfWork } from "./infrastructure/db/PostgreUnitOfWork.ts";
import { InMemoryUnitOfWork } from "./infrastructure/repositories/InMemoryUnitOfWork.ts";
import type { IUnitOfWork } from "./application/IUnitOfWork.ts";
import dbClient from "./infrastructure/db/postgresClient.ts";

const env = Deno.env.get("NODE_ENV") || "development";

let noteRepository: NoteRepository;
let folderRepository: FolderRepository;
let tagRepository: TagRepository;

// factory method tạo mới unit of work cho mỗi use case
let createUnitOfWork: () => IUnitOfWork;

// Switch repository types based on environment
switch (env) {
    case "test":
        folderRepository = new InMemoryFolderRepository();
        noteRepository = new InMemoryNoteRepository(folderRepository);
        tagRepository = new InMemoryTagRepository(noteRepository, folderRepository);

        createUnitOfWork = () => {
            return new InMemoryUnitOfWork(noteRepository, tagRepository, folderRepository);
        };
        break;

    case "production":
        folderRepository = new PostgreFolderRepository();
        noteRepository = new PostgreNoteRepository();
        tagRepository = new PostgreTagRepository();

        createUnitOfWork = () => {
            const tx = dbClient.createTransaction("unit_of_work_tx");
            const noteRepo = new PostgreNoteRepository(tx);
            const folderRepo = new PostgreFolderRepository(tx);
            const tagRepo = new PostgreTagRepository(tx);
            return new PostgreUnitOfWork(tx, noteRepo, tagRepo, folderRepo);
        };
        break;

    case "development":
    default:
        folderRepository = new InMemoryFolderRepository();
        noteRepository = new InMemoryNoteRepository(folderRepository);
        tagRepository = new InMemoryTagRepository(noteRepository, folderRepository);

        createUnitOfWork = () => {
            return new InMemoryUnitOfWork(noteRepository, tagRepository, folderRepository);
        };
        break;
}

export { createUnitOfWork, folderRepository, noteRepository, tagRepository };
