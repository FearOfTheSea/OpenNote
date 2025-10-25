import { Tag } from "../../domain/entities/Tag.ts";

export interface TagRepository {
    findAll(userId: string): Promise<Tag[]>;
    save(tag: Tag, noteId: string): Promise<void>;
    syncTagsForNoteUpdate(noteId: string, noteContent: string): Promise<void>;
    deleteOrphanedTag(id: string): Promise<void>;
}
