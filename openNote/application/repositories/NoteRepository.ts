import { Note } from "../../domain/entities/Note";

export interface NoteRepository {
    findById(id: string): Promise<Note | null>;
    findByName(id: string): Promise<Note[]>;
    findAll(): Promise<Note[]>;
    findByFolderId(id: string): Promise<Note[]>;
    findByTag(id: string): Promise<Note[]>;
    save(note: Note): Promise<void>;
    delete(id: string): Promise<void>;
    searchByKeyword(keyword: string): Promise<Note[]>;
}
