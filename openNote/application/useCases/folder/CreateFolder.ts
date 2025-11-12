import { Folder } from "../../../domain/entities/Folder.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface CreateFolderInput {
    readonly name: string;
    readonly userId: string;
    readonly parentFolderId?: string;
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
        const neighboring_folders = await this.folderRepository.findByParentFolderId(
            input.parentFolderId,
            input.userId,
        );
        if (neighboring_folders.some((folder) => folder.name === input.name.trim())) {
            throw new Error("Folder with the same name already exists in the parent folder");
        }
        try {
            const folder = new Folder(input.name, input.userId, input.parentFolderId);
            await this.folderRepository.save(folder);
            console.log(`[CreateFolder] Created folder with name = "${folder.name}"`);

            return { folder: folder };
        } catch (error) {
            throw error;
        }
    }
}
