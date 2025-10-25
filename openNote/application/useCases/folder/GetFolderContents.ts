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
    constructor(private folderRepository: FolderRepository, private noteRepository: NoteRepository) {}

    async execute(input: GetFolderContentsInput): Promise<GetFolderContentsOutput> {
        if (!(await this.folderRepository.findById(input.folderId))) {
            throw new Error(`Folder with ID ${input.folderId} not found`);
        }

        const folders = await this.folderRepository.findByParentFolderId(input.folderId, input.userId);
        const notes = await this.noteRepository.findByFolderId(input.folderId);

        return { folders, notes } as GetFolderContentsOutput;
    }
}
