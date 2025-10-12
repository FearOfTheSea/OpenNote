import { Note } from "../../domain/entities/Note";

export interface NoteRepository {
  findById(id: string): Promise<Note | null>;
  findByName(name: string): Promise<Note[]>;
  findAll(): Promise<Note[]>;
  findByFolderId(folderId: string): Promise<Note[]>;
  findByTag(tagId: string): Promise<Note[]>;
  save(note: Note): Promise<void>;
  delete(id: string): Promise<void>;
  searchByKeyword(keyword: string): Promise<Note[]>;
}
