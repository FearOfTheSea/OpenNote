import { Transaction } from "pg";
import { Note } from "../../domain/entities/Note.ts";

export interface NoteRepository {
  // ko can dau vi ban goc ko co checkExistenceByName(name: string, folderId: string): Promise<boolean>;
  findAll(userId: string): Promise<Note[]>; // will be deleted in v2.0
  findById(id: string): Promise<Note | null>;
  findByFolderId(folderId: string): Promise<Note[]>;
  findByTagsIds(tagIds: string[], userId: string): Promise<Note[]>;
  //open note doesnt have copyNote(noteId: string, targetFolderId: string): Promise<Note>;
  cutNote(noteId: string, newFolderId: string): Promise<boolean>;
  save(note: Note): Promise<void>;
  delete(id: string): Promise<void>;
  searchByKeyword(keyword: string, userId: string): Promise<Note[]>;
}
