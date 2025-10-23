import { Folder } from "../../../domain/entities/Folder.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface SearchFoldersInput {
    readonly query: string;
    readonly userId: string;
}

export interface SearchFoldersOutput {
    folders: Folder[];
}

export class SearchFolders {
    constructor(private folderRepository: FolderRepository) {}

    async execute(input: SearchFoldersInput): Promise<SearchFoldersOutput> {
        const matchingFolders = await this.folderRepository.findByName(input.query, input.userId);
        return { folders: matchingFolders };
    }
}
