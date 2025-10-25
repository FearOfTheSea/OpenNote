import { Folder } from "../../../domain/entities/Folder.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface SearchFoldersInput {
    readonly keyword: string;
    readonly userId: string;
}

export interface SearchFoldersOutput {
    folders: Folder[];
}

export class SearchFolders {
    constructor(private folderRepository: FolderRepository) {}

    async execute(input: SearchFoldersInput): Promise<SearchFoldersOutput> {
        const matchingFolders = await this.folderRepository.findByName(input.keyword, input.userId);
        return { folders: matchingFolders };
    }
}
