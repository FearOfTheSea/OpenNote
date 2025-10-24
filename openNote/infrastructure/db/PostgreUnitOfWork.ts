import { Transaction } from "pg";
import { IUnitOfWork } from "../../application/IUnitOfWork.ts";
import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import { TagRepository } from "../../application/repositories/TagRepository.ts";
import { PostgreNoteRepository } from "../repositories/PostgreNoteRepository.ts";
import { PostgreTagRepository } from "../repositories/PostgreTagRepository.ts";

export class PostgreUnitOfWork implements IUnitOfWork {
  private tx: Transaction;
  public notes: NoteRepository;
  public tags: TagRepository;

  constructor(tx: Transaction, notes: NoteRepository, tags: TagRepository) {
    this.tx = tx;
    this.notes = notes;
    this.tags = tags;
  }

  async begin(): Promise<void> {
    await this.tx.begin();
    this.notes = new PostgreNoteRepository(this.tx);
    this.tags = new PostgreTagRepository(this.tx);
  }

  async commit(): Promise<void> {
    await this.tx.commit();
  }

  async rollback(): Promise<void> {
    await this.tx.rollback();
  }
}
