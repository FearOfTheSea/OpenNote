import { Folder } from "../../../domain/entities/Folder.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface SearchFoldersInput {
  query: string;
  parentFolderId?: string;
}

export interface SearchFoldersOutput {
  folders: Folder[];
}

export class SearchFolders {
  constructor(private folderRepository: FolderRepository) {}

  async execute(input: SearchFoldersInput): Promise<SearchFoldersOutput> {
    if (!input.query.trim()) {
      return { folders: [] };
    }

    const allFolders = await this.folderRepository.findAll();

    const filteredFolders = allFolders.filter((folder) => {
      const matchesQuery = folder.name.toLowerCase().includes(
        input.query.toLowerCase().trim(),
      );

      const matchesParent = input.parentFolderId !== undefined
        ? folder.folderId === input.parentFolderId
        : true;

      return matchesQuery && matchesParent;
    });

    return { folders: filteredFolders };
  }
}
