import { Folder } from '../../../domain/entities/Folder';
import { FolderRepository } from '../../../domain/repositories/FolderRepository';

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
        const folder: Folder = {
            id: this.generateId(),
            name: input.name,
            folderId: input.folderId
        };

        await this.folderRepository.save(folder);

        return { id: folder.id };
    }

    private generateId(): string {
        return crypto.randomUUID();
    }
}