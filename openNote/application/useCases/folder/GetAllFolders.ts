import { Folder } from "../../../domain/entities/Folder.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface GetAllFoldersOutput {
    readonly folders: Folder[];
}

export class GetAllFolders {
    constructor(private readonly folderRepository: FolderRepository) {}

    async execute(): Promise<GetAllFoldersOutput> {
        return { folders: await this.folderRepository.findAll() };
    }
}
