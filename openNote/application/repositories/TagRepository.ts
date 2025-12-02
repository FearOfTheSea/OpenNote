import { Tag } from "../../domain/entities/Tag.ts";

export interface TagRepository {
  findAll(userId: string): Promise<Tag[]>;
  findByName(tagName: string): Promise<Tag | null>;
  save(tag: Tag, noteId: string): Promise<void>;
  syncTagsForNoteUpdate(noteId: string, noteContent: string): Promise<void>;
  deleteOrphanedTag(id: string): Promise<void>;
  cleanupOrphanTags(): Promise<void>;
}
