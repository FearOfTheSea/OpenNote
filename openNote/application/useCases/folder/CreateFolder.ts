import { Folder } from "../../../domain/entities/Folder.ts";
import { UseCase } from "../../core/UseCase.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";

export interface CreateFolderInput {
  readonly name: string;
  readonly userId: string;
  readonly parentFolderId?: string;
}

export interface CreateFolderOutput {
  readonly folder: Folder;
}

export class CreateFolder implements UseCase<CreateFolderInput, CreateFolderOutput> {
  constructor(private folderRepository: FolderRepository) {}

  async execute(input: CreateFolderInput): Promise<CreateFolderOutput> {
    let parentFolderId = input.parentFolderId;
    if (parentFolderId) {
      if (parentFolderId.trim() === "") {
        parentFolderId = undefined;
      } else {
        parentFolderId = parentFolderId.trim();
      }
    }

    console.log(parentFolderId);
    if (
      parentFolderId &&
      !(await this.folderRepository.findById(parentFolderId))
    ) {
      throw new Error("Parent folder not found");
    }

    const neighboring_folders = await this.folderRepository.findByParentFolderId(
      parentFolderId,
      input.userId,
    );

    if (
      neighboring_folders.some((folder) => folder.name === input.name.trim())
    ) {
      throw new Error(
        "[CreateFolder] Folder with the same name already exists in the parent folder",
      );
    }

    try {
      const folder = new Folder(input.name, input.userId, parentFolderId);
      await this.folderRepository.save(folder);

      console.log(
        `[CreateFolder] Created folder: name=${folder.name}, parent=${parentFolderId ?? "ROOT"}`,
      );

      return { folder };
    } catch (error) {
      throw error;
    }
  }
}
