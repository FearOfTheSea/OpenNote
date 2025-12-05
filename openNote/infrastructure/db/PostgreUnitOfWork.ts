import { PoolClient, Transaction } from "pg";
import { IUnitOfWork } from "../../application/ports/IUnitOfWork.ts";
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
    private client: PoolClient,
    noteRepo: NoteRepository,
    tagRepo: TagRepository,
    folderRepo: FolderRepository,
  ) {
    this.tx = tx;
    this.client = client;
    this.notes = noteRepo;
    this.tags = tagRepo;
    this.folders = folderRepo;
  }

  async begin(): Promise<void> {
    if (!this.tx) throw new Error("Transaction not initialized");
    await this.tx.begin();
    // this.notes = new PostgreNoteRepository(this.tx);
    // this.tags = new PostgreTagRepository(this.tx);
    // this.folders = new PostgreFolderRepository(this.tx);
  }

  async commit(): Promise<void> {
    try {
      await this.tx.commit();
    } finally {
      this.client.release();
    }
  }

  async rollback(): Promise<void> {
    try {
      await this.tx.rollback();
    } finally {
      this.client.release();
    }
  }
}
