import { Folder } from "../../../domain/entities/Folder.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface GetFoldersInput {
    parentFolderId?: string;
}

export interface GetFoldersOutput {
    folders: Folder[];
}

export class GetFolders {
    constructor(private folderRepository: FolderRepository) {}

    async execute(input: GetFoldersInput): Promise<GetFoldersOutput> {
        const allFolders = await this.folderRepository.findAll();

        let parentFolderId: string = input.parentFolderId;
        if (!input.parentFolderId) {
            parentFolderId = "root";
        }

        const parentFolder = await this.folderRepository.findById(parentFolderId);
        if (!parentFolder) {
            throw new Error("Parent folder not found");
        }

        const filteredFolders = allFolders.filter((folder) => folder.parentFolderId === parentFolderId);
        return { folders: filteredFolders };
    }
}
