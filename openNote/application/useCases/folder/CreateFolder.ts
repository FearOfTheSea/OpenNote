import { Folder } from "../../../domain/entities/Folder";
import { FolderRepository } from "../../repositories/FolderRepository";

export interface CreateFolderInput {
  readonly name: string;
  readonly folderId?: string;
}

export interface CreateFolderOutput {
  readonly id: string;
  readonly createdAt: Date;
  readonly UpdatedAt: Date;
}

export class CreateFolder {
  constructor(private folderRepository: FolderRepository) {}

  async execute(input: CreateFolderInput): Promise<CreateFolderOutput> {
    try {
      const folder = new Folder(
        input.name,
        undefined,
        input.folderId,
      );
      await this.folderRepository.save(folder);
      return {
        id: folder.id,
        createdAt: folder.createdAt,
        UpdatedAt: folder.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  }
}
