import { Folder } from "../../../domain/entities/Folder.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface GetFolderByIdInput {
  folderId: string;
}

export interface GetFolderByIdOutput {
  folder: Folder;
}

export class GetFolderById {
  constructor(private folderRepository: FolderRepository) {}

  async execute(input: GetFolderByIdInput): Promise<GetFolderByIdOutput> {
    const folder = await this.folderRepository.findById(input.folderId);

    if (!folder) {
      throw new Error(`Folder with id ${input.id} not found`);
    }

    return { folder: folder };
  }
}
