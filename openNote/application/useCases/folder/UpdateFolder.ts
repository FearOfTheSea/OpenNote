import { Folder } from "../../../domain/entities/Folder.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface UpdateFolderInput {
  readonly id: string;
  readonly newName: string;
  readonly newParentFolderId?: string;
}

export interface UpdateFolderOutput {
  readonly folder: Folder;
}

export class UpdateFolder {
  constructor(private folderRepository: FolderRepository) {}

  async execute(input: UpdateFolderInput): Promise<UpdateFolderOutput> {
    const existingFolder = await this.folderRepository.findById(input.id);
    if (!existingFolder) {
      throw new Error(`Folder with id ${input.id} not found`);
    }
    if (!input.newParentFolderId && !input.newName) {
      return { folder: existingFolder };
    }

    let newName = existingFolder.name;
    if (input.newName) {
      newName = input.newName.trim();
    }

    if (input.newParentFolderId && input.newParentFolderId !== "") {
      const newParentFolder = await this.folderRepository.findById(input.newParentFolderId);
      if (!newParentFolder) {
        throw new Error(`New parent folder with id ${input.newParentFolderId} not found`);
      }
      if (input.newParentFolderId === existingFolder.id) {
        throw new Error(`Folder with id ${input.newParentFolderId} can't be its own parent`);
      }

      const neighboring_folders = await this.folderRepository.findByParentFolderId(
        input.newParentFolderId,
        existingFolder.userId,
      );
      if (neighboring_folders.some((folder) => folder.name === newName)) {
        throw new Error("Folder with the same name already exists in the parent folder");
      }
    } else if (input.newName) {
      const neighboring_folders = await this.folderRepository.findByParentFolderId(
        // existingFolder.parentFolderId,
        undefined,
        existingFolder.userId,
      );

      if (neighboring_folders.some((folder) => folder.name === newName)) {
        throw new Error("Folder with the same name already exists in the parent folder");
      }
    }

    const updatedFolder = {
      id: input.id,
      name: newName,
      userId: existingFolder.userId,
      parentFolderId: input.newParentFolderId,
      createdAt: existingFolder.createdAt,
      updatedAt: new Date(),
    };

    await this.folderRepository.save(updatedFolder);
    console.log(
      `Updated folder: id: ${updatedFolder.id}, name: ${updatedFolder.name}, parentFolderId: ${updatedFolder.parentFolderId}, userId: ${updatedFolder.userId}`,
    );

    return { folder: updatedFolder };
  }
}
