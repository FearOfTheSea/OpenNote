import { Note } from "../../domain/entities/Note";

export interface NoteRepository {
    findAll(): Promise<Note[]>;
    findById(id: string): Promise<Note | null>;
    findByFolderId(folderId: string): Promise<Note[]>;
    save(note: Note): Promise<void>;
    delete(id: string): Promise<void>;
    searchByKeyword(keyword: string, folderId?: string): Promise<Note[]>;
    findNotesByTagsIds(tagsIds: string[]): Promise<Note[]>;
}
