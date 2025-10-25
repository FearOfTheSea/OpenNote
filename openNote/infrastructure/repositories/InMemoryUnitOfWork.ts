import { IUnitOfWork } from "../../application/IUnitOfWork.ts";
import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import { TagRepository } from "../../application/repositories/TagRepository.ts";
import { FolderRepository } from "../../application/repositories/FolderRepository.ts";

export class InMemoryUnitOfWork implements IUnitOfWork {
    public notes: NoteRepository;
    public tags: TagRepository;
    public folders: FolderRepository;

    constructor(noteRepo: NoteRepository, tagRepo: TagRepository, folderRepo: FolderRepository) {
        this.notes = noteRepo;
        this.tags = tagRepo;
        this.folders = folderRepo;
    }

    async begin(): Promise<void> {
    }

    async commit(): Promise<void> {
    }

    async rollback(): Promise<void> {
    }
}
