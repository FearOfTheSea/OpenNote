import { Folder } from "../../../domain/entities/Folder";
import { FolderRepository } from "../../repositories/FolderRepository";

export interface CreateFolderInput {
    readonly name: string;
    readonly parentFolderId?: string;
    readonly userId: string;
}

export interface CreateFolderOutput {
    readonly folder: Folder;
}

export class CreateFolder {
    constructor(private folderRepository: FolderRepository) {}

    async execute(input: CreateFolderInput): Promise<CreateFolderOutput> {
        if (input.parentFolderId && !await this.folderRepository.findById(input.parentFolderId)) {
            throw new Error("Parent folder not found");
        }
        try {
            const folder = new Folder(input.name, input.parentFolderId, input.userId);
            await this.folderRepository.save(folder);
            return { folder: folder };
        } catch (error) {
            throw error;
        }
    }
}
