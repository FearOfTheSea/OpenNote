import { Transaction } from "pg";
import { IUnitOfWork } from "../../application/IUnitOfWork.ts";
import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import { TagRepository } from "../../application/repositories/TagRepository.ts";
import { FolderRepository } from "../../application/repositories/FolderRepository.ts";

export class PostgreUnitOfWork implements IUnitOfWork {
    private tx: Transaction;
    public notes: NoteRepository;
    public tags: TagRepository;
    public folders: FolderRepository;

    constructor(
        tx: Transaction,
        noteRepo: NoteRepository,
        tagRepo: TagRepository,
        folderRepo: FolderRepository,
    ) {
        this.tx = tx;
        this.notes = noteRepo;
        this.tags = tagRepo;
        this.folders = folderRepo;
    }

    async begin(): Promise<void> {
        await this.tx.begin();
        // this.notes = new PostgreNoteRepository(this.tx);
        // this.tags = new PostgreTagRepository(this.tx);
        // this.folders = new PostgreFolderRepository(this.tx);
    }

    async commit(): Promise<void> {
        await this.tx.commit();
    }

    async rollback(): Promise<void> {
        await this.tx.rollback();
    }
}
