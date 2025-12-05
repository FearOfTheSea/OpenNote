import { IUnitOfWork } from "../../../application/ports/IUnitOfWork.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import { DeleteFolder, DeleteFolderInput } from "../../../application/useCases/folder/DeleteFolder.ts";

export interface DeleteFolderRequest {
  id: string;
}

export class DeleteFolderController {
  private useCase: DeleteFolder;

  constructor(
    folderRepository: FolderRepository,
    noteRepository: NoteRepository,
    createUnitOfWork: () => Promise<IUnitOfWork>,
  ) {
    this.useCase = new DeleteFolder(
      folderRepository,
      noteRepository,
      createUnitOfWork,
    );
  }

  async apply(request: DeleteFolderRequest): Promise<void> {
    const input = request as DeleteFolderInput;
    try {
      return await this.useCase.execute(input);
    } catch (error) {
      throw error;
    }
  }
}
