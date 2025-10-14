import { Folder } from "../../../domain/entities/Folder";
import { FolderRepository } from "../../repositories/FolderRepository";

export interface CreateFolderInput {
    readonly name: string;
    readonly parentFolderId?: string;
}

export interface CreateFolderOutput {
    readonly id: string;
    readonly parentFolderId: string;
    readonly createdAt: Date;
    readonly UpdatedAt: Date;
}

export class CreateFolder {
    constructor(private folderRepository: FolderRepository) {}

    async execute(input: CreateFolderInput): Promise<CreateFolderOutput> {
        const parentFolderId = input.parentFolderId ? input.parentFolderId : "root";
        const parentFolder = await this.folderRepository.findById(parentFolderId);
        if (!parentFolder) {
            throw new Error("Parent folder not found");
        }
        try {
            const folder = new Folder(
                input.name,
                parentFolderId,
                false,
            );
            await this.folderRepository.save(folder);
            return {
                id: folder.id,
                parentFolderId: folder.parentFolderId,
                createdAt: folder.createdAt,
                UpdatedAt: folder.updatedAt,
            };
        } catch (error) {
            throw error;
        }
    }
}
