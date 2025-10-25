import { IUnitOfWork } from "../../IUnitOfWork.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface DeleteFolderInput {
    id: string;
}

export class DeleteFolder {
    constructor(
        private folderRepository: FolderRepository,
        private readonly createNoteUnitOfWork: () => IUnitOfWork,
    ) {}

    async execute(input: DeleteFolderInput): Promise<void> {
        const folder = await this.folderRepository.findById(input.id);

        if (!folder) {
            throw new Error(`Folder with id ${input.id} not found`);
        }

        const uow = this.createNoteUnitOfWork();
        try {
            await uow.begin();
            await uow.folders.delete(input.id);
            await uow.tags.cleanupOrphanTags();
            await uow.commit();
        } catch (error) {
            await uow.rollback();
            throw error;
        }
    }
}
