import { Folder } from "../../../domain/entities/Folder.ts";
import { Note } from "../../../domain/entities/Note.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface GetFolderContentsInput {
  folderId?: string;
}

export interface GetFolderContentsOutput {
  folders: Folder[];
  notes: Note[];
}

export class GetFolderContents {
  constructor(
    private folderRepository: FolderRepository,
    private noteRepository: NoteRepository,
  ) {}

  async execute(
    input: GetFolderContentsInput,
  ): Promise<GetFolderContentsOutput> {
    const [allFolders, allNotes] = await Promise.all([
      this.folderRepository.findAll(),
      this.noteRepository.findAll(),
    ]);

    const folders = allFolders.filter((folder) =>
      folder.folderId === input.folderId
    );

    const notes = allNotes.filter((note) => note.folderId === input.folderId);

    return { folders, notes };
  }
}
