import { Transaction } from "pg";
import { Tag } from "../../domain/entities/Tag.ts";

export interface TagRepository {
  findAll(userId: string): Promise<Tag[] | null>;
  findById(id: string): Promise<Tag | null>;
  save(tag: Tag, noteId: string, tx: Transaction): Promise<void>;
  delete(id: string, tx: Transaction): Promise<void>;
}
