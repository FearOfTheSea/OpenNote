import { NoteRepository } from "./repositories/NoteRepository.ts";
import { TagRepository } from "./repositories/TagRepository.ts";

export interface IUnitOfWork {
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;

    // for persisting changes while saving notes and tags within a transaction
    // but not polluting application layer with transaction details
    // related to use case update note, create note
    notes: NoteRepository;
    tags: TagRepository;
}
