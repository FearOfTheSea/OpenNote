import { Note } from "../../domain/entities/Note.ts";

export interface NoteRepository {
    findAll(userId: string): Promise<Note[]>;
    findById(id: string): Promise<Note | null>;
    findByFolderId(folderId: string): Promise<Note[]>;
    findByTagsIds(tagIds: string[], userId: string): Promise<Note[]>;
    cutNote(noteId: string, newFolderId: string): Promise<boolean>;
    save(note: Note): Promise<void>;
    delete(id: string): Promise<void>;
    searchByKeyword(keyword: string, userId: string): Promise<Note[]>;
}
