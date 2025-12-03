import { Folder } from "../../domain/entities/Folder.ts";
import { Note } from "../../domain/entities/Note.ts";

export interface BackupTag {
  id: string;
  name: string;
}

export interface BackupDataDTO {
  version: number;
  timestamp: string;
  userId: string;
  data: {
    folders: Folder[];
    notes: Note[];
    tags: BackupTag[];
  };
}
