import { Folder } from "../../../domain/entities/Folder.ts";
import { Note } from "../../../domain/entities/Note.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface GetFolderContentsInput {
    readonly folderId: string;
}

export interface GetFolderContentsOutput {
    readonly folders: Folder[];
    readonly notes: Note[];
}

export class GetFolderContents {
    constructor(
        private folderRepository: FolderRepository,
        private noteRepository: NoteRepository,
    ) {}

    async execute(input: GetFolderContentsInput): Promise<GetFolderContentsOutput> {
        const allFolders = await this.folderRepository.findAll();
        const allNotes = await this.noteRepository.findAll();

        const folders = allFolders.filter((folder) => folder.parentFolderId === input.folderId);
        const notes = allNotes.filter((note) => note.folderId === input.folderId);

        return { folders, notes };
    }
}
