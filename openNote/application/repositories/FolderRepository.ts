import { Folder } from "../../domain/entities/Folder.ts";
import { NoteRepository } from "./NoteRepository.ts";

export interface FolderRepository {
  findAll(userId: string): Promise<Folder[]>;
  findById(id: string): Promise<Folder | null>;
  findByName(name: string, userId: string): Promise<Folder[]>;
  findByParentFolderId(parentFolderId: string | undefined, userId: string): Promise<Folder[]>;
  cutFolder(folderId: string, userId: string, newParentFolderId: string | undefined): Promise<boolean>;
  save(folder: Folder): Promise<void>;
  delete(id: string, noteRepository: NoteRepository): Promise<void>;
}
