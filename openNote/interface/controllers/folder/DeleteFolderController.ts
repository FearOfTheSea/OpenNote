import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { DeleteFolder, DeleteFolderInput } from "../../../application/useCases/folder/DeleteFolder.ts";

export interface DeleteFolderRequest {
    id: string;
}

export class DeleteFolderController {
    private useCase: DeleteFolder;

    constructor(folderRepository: FolderRepository) {
        this.useCase = new DeleteFolder(folderRepository);
    }

    async apply(request: DeleteFolderInput): Promise<void> {
        const input = request as DeleteFoldersInput;
        try {
            return await this.useCase.execute(input);
        } catch (error) {
            throw error;
        }
    }
}
