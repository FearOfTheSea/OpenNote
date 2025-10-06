import { Folder } from '../../../domain/entities/Folder';
import { FolderRepository } from '../../repositories/FolderRepository';

export interface CreateFolderInput {
    name: string;
    folderId?: string;
}

export interface CreateFolderOutput {
    id: string;
}

export class CreateFolder {
    constructor(private folderRepository: FolderRepository) {}

    async execute(input: CreateFolderInput): Promise<CreateFolderOutput> {
        const folder = new Folder(
            input.name,
            undefined,
            input.folderId);

        await this.folderRepository.save(folder);

        return { id: folder.id };
    }

    private generateId(): string {
        return crypto.randomUUID();
    }
}