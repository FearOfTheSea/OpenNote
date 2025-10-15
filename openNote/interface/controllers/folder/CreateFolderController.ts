import { CreateFolder, CreateFolderInput } from "../../../application/useCases/folder/CreateFolder.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";

export interface CreateFolderRequest {
    readonly name: string;
    readonly parentFolderId?: string;
    readonly userId: string;
}

export interface CreateFolderResponse {
    readonly id: string;
    readonly name: string;
    readonly userId: string;
    readonly parentFolderId?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export class CreateFolderController {
    private useCase: CreateFolder;

    constructor(folderRepository: FolderRepository) {
        this.useCase = new CreateFolder(folderRepository);
    }

    async apply(request: CreateFolderRequest): Promise<CreateFolderResponse> {
        const input = request as CreateFolderInput;
        try {
            return await this.useCase.execute(input) as CreateFolderResponse;
        } catch (error) {
            throw error;
        }
    }
}
