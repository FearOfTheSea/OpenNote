import { Folder } from "../../../domain/entities/Folder.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

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

    const filteredFolders = allFolders.filter((folder) =>
      folder.parentFolderId === input.parentFolderId
    );

    return { folders: filteredFolders };
  }
}
