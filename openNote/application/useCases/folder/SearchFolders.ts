import { Folder } from "../../../domain/entities/Folder.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface SearchFoldersInput {
    readonly query: string;
    readonly parentFolderId?: string;
}

export interface SearchFoldersOutput {
    folders: Folder[];
}

export class SearchFolders {
    constructor(private folderRepository: FolderRepository) {}

    async execute(input: SearchFoldersInput): Promise<SearchFoldersOutput> {
        const { query, parentFolderId } = input;

        if (input.parentFolderId) {
            const parentFolder = await this.folderRepository.findById(parentFolderId);
            if (!parentFolder) {
                throw new Error(`Parent folder with id ${parentFolderId} not found`);
            }
        }

        const matchingFolders = await this.folderRepository.searchByKeyword(query, parentFolderId);
        return { folders: matchingFolders };
    }
}
