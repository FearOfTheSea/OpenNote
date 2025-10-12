import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface DeleteFolderInput {
  id: string;
}

export class DeleteFolder {
  constructor(private folderRepository: FolderRepository) {}

  async execute(input: DeleteFolderInput): Promise<void> {
    const folder = await this.folderRepository.findById(input.id);

    if (!folder) {
      throw new Error(`Folder with id ${input.id} not found`);
    }

    return await this.folderRepository.delete(input.id);
  }
}
