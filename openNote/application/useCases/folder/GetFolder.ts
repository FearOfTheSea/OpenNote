import { Folder } from '../../../domain/entities/Folder';
import { FolderRepository } from '../../repositories/FolderRepository';

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

        const filteredFolders = allFolders.filter(folder =>
            folder.folderId === input.parentFolderId
        );

        return { folders: filteredFolders };
    }
}