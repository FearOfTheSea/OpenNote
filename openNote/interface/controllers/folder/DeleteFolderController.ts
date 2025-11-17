import { IUnitOfWork } from "../../../application/IUnitOfWork.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import { DeleteFolder, DeleteFolderInput } from "../../../application/useCases/folder/DeleteFolder.ts";

export interface DeleteFolderRequest {
    id: string;
    noteRepository: NoteRepository;
}

export class DeleteFolderController {
    private useCase: DeleteFolder;

    constructor(folderRepository: FolderRepository, createUnitOfWork: () => IUnitOfWork) {
        this.useCase = new DeleteFolder(folderRepository, createUnitOfWork);
    }

    async apply(request: DeleteFolderInput): Promise<void> {
        const input = request as DeleteFolderInput;
        try {
            return await this.useCase.execute(input);
        } catch (error) {
            throw error;
        }
    }
}
