import { Folder } from "../../../domain/entities/Folder.ts";
import { Note } from "../../../domain/entities/Note.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface GetFolderContentsInput {
  readonly userId: string;
  readonly folderId: string;
}

export interface GetFolderContentsOutput {
  readonly folders: Folder[];
  readonly notes: Note[];
}

export class GetFolderContents {
  constructor(
    private folderRepository: FolderRepository,
    private noteRepository: NoteRepository
  ) {}

  // nen dung findByParentFolderId de lay folder con
  // nen dung findByFolderId de lay note con
  async execute(
    input: GetFolderContentsInput
  ): Promise<GetFolderContentsOutput> {
    if (!(await this.folderRepository.findById(input.folderId))) {
      throw new Error(`Folder with ID ${input.folderId} not found`);
    }

    const allFolders = await this.folderRepository.findAll(input.userId);
    const allNotes = await this.noteRepository.findAll(input.userId);

    const folders = allFolders.filter(
      (folder) => folder.parentFolderId === input.folderId
    );
    const notes = allNotes.filter(
      (note) => note.parentFolderId === input.folderId
    );

    return { folders, notes };
  }
}
