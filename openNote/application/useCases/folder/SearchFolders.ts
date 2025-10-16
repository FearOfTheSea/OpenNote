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
        if (input.parentFolderId) {
            const parentFolder = await this.folderRepository.findById(input.parentFolderId);
            if (!parentFolder) {
                throw new Error(`Parent folder with id ${input.parentFolderId} not found`);
            }
        }

        const matchingFolders = await this.folderRepository.searchByKeyword(input.query, input.parentFolderId);
        return { folders: matchingFolders };
    }
}
