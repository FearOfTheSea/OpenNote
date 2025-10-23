import { Note } from "../../domain/entities/Note.ts";

export interface NoteRepository {
  findAll(userId: string): Promise<Note[]>; // will be deleted in v2.0
  findById(id: string): Promise<Note | null>;
  findByFolderId(id: string): Promise<Note[]>;
  findByTagIds(tagIds: string[], userId: string): Promise<Note[]>;
  //open note doesnt have copyNote(noteId: string, targetFolderId: string): Promise<Note>;
  cutNote(noteId: string, newFolderId: string): Promise<void>;
  save(note: Note): Promise<void>;
  delete(id: string): Promise<void>;
  searchByKeyword(keyword: string, userId: string): Promise<Note[]>;
}
