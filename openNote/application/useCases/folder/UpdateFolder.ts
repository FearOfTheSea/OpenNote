import { Folder } from "../../../domain/entities/Folder.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface UpdateFolderInput {
    readonly id: string;
    readonly name?: string;
    readonly parentFolderId?: string;
}

export interface UpdateFolderOutput {
    readonly folder: Folder;
}

export class UpdateFolder {
    constructor(private folderRepository: FolderRepository) {}

    async execute(input: UpdateFolderInput): Promise<UpdateFolderOutput> {
        const existingFolder = await this.folderRepository.findById(input.id);
        if (!existingFolder) {
            throw new Error(`Folder with id ${input.id} not found`);
        }

        if (input.parentFolderId) {
            const newParentFolder = await this.folderRepository.findById(input.parentFolderId);
            if (!newParentFolder) {
                throw new Error(`New parent folder with id ${input.parentFolderId} not found`);
            }
            if (input.parentFolderId === existingFolder.id) {
                throw new Error(`Folder with id ${input.parentFolderId} can't be its own parent`);
            }
        }

        const updatedFolder = {
            id: input.id,
            name: input.name ? input.name : existingFolder.name,
            userId: existingFolder.userId,
            parentFolderId: input.parentFolderId,
            createdAt: existingFolder.createdAt,
            updatedAt: new Date(),
        };

        await this.folderRepository.save(updatedFolder);
        return { folder: updatedFolder };
    }
}
