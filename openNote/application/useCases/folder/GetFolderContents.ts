import { Folder } from "../../../domain/entities/Folder.ts";
import { Note } from "../../../domain/entities/Note.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface GetFolderContentsInput {
    readonly folderId?: string;
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

    async execute(
        input: GetFolderContentsInput,
    ): Promise<GetFolderContentsOutput> {
        const [allFolders, allNotes] = await Promise.all([
            this.folderRepository.findAll(),
            this.noteRepository.findAll(),
        ]);

        const folders = allFolders.filter((folder) => folder.parentFolderId === input.folderId);

        const notes = allNotes.filter((note) => note.parentFolderId === input.folderId);

        return { folders, notes };
    }
}
