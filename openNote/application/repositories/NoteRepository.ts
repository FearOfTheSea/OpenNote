import { Note } from "../../domain/entities/Note.ts";

export interface NoteRepository {
  findById(id: string): Promise<Note | null>;
  findAll(): Promise<Note[]>;
  save(note: Note): Promise<void>;
  delete(id: string): Promise<void>;
}
