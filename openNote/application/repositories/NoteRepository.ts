import { Note } from "../../domain/entities/Note.ts";

export interface NoteRepository {
    findById(id: string): Promise<Note | null>;
    findByFolderId(id: string): Promise<Note[]>;
    findByTag(tag: string, userId: string): Promise<Note[]>;
    copyNote(noteId: string, targetFolderId: string): Promise<Note>;
    cutNote(noteId: string, newFolderId: string): Promise<void>;
    save(note: Note): Promise<void>;
    delete(id: string): Promise<void>;
    searchByKeyword(keyword: string, userId: string): Promise<Note[]>;
}
