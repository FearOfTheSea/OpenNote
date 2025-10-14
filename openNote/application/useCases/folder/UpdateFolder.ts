import { Folder } from "../../../domain/entities/Folder";
import { FolderRepository } from "../../repositories/FolderRepository";

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
        if (input.id === "root") {
            throw new Error("Cannot update the root folder");
        }
        const existingFolder = await this.folderRepository.findById(input.id);

        if (!existingFolder) {
            throw new Error(`Folder with id ${input.id} not found`);
        }

        if (input.parentFolderId) {
            const newParentFolder = await this.folderRepository.findById(input.parentFolderId);
            if (!newParentFolder) {
                throw new Error(`New parent folder with id ${input.parentFolderId} not found`);
            }
        }

        const updatedFolder = {
            id: input.id,
            name: input.name ? input.name : existingFolder.name,
            parentFolderId: input.parentFolderId ? input.parentFolderId : existingFolder.parentFolderId,
            createdAt: existingFolder.createdAt,
            updatedAt: new Date(),
        };

        await this.folderRepository.save(updatedFolder);
        return { folder: updatedFolder };
    }
}
