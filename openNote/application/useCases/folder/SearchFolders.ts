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
        const parentFolderId = input.parentFolderId ? input.parentFolderId : "root";

        const parentFolder = await this.folderRepository.findById(parentFolderId);
        if (!parentFolder) {
            throw new Error(`Parent folder with id ${parentFolderId} not found`);
        }

        const allFolders = await this.folderRepository.findAll();
        const query = input.query.toLowerCase().trim();

        const filteredFolders = allFolders.filter((folder) => {
            const matchesQuery = folder.name.toLowerCase().includes(query);
            const matchesParent = folder.parentFolderId === parentFolderId;
            return matchesQuery && matchesParent;
        });

        return { folders: filteredFolders };
    }
}
