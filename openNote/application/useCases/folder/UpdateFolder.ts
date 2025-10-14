import { Folder } from "../../../domain/entities/Folder";
import { FolderRepository } from "../../repositories/FolderRepository";

export interface UpdateFolderInput {
    readonly id: string;
    readonly name?: string;
    readonly folderId?: string;
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

        const updatedFolder = new Folder(
            input.name !== undefined ? input.name : existingFolder.name,
            input.id,
            input.folderId !== undefined ? input.folderId : existingFolder.parentFolderId,
        );

        await this.folderRepository.save(updatedFolder);
        return { folder: updatedFolder };
    }
}
