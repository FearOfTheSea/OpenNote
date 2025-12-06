import { Folder } from "../../../domain/entities/Folder.ts";
import { UseCase } from "../../core/UseCase.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { IUnitOfWork } from "../../ports/IUnitOfWork.ts";

export interface UpdateFolderInput {
  readonly id: string;
  readonly newName?: string;
  readonly newParentFolderId?: string;
}

export interface UpdateFolderOutput {
  readonly folder: Folder;
}

export class UpdateFolder
  implements UseCase<UpdateFolderInput, UpdateFolderOutput>
{
  constructor(
    private folderRepository: FolderRepository,
    private readonly createNoteUnitOfWork: () => Promise<IUnitOfWork>
  ) {}

  async execute(input: UpdateFolderInput): Promise<UpdateFolderOutput> {
    const existingFolder = await this.folderRepository.findById(input.id);
    if (!existingFolder) {
      throw new Error(`Folder with id ${input.id} not found`);
    }

    if (input.newName === undefined && input.newParentFolderId === undefined) {
      return { folder: existingFolder };
    }

    let newName = existingFolder.name;
    if (input.newName) {
      newName = input.newName.trim();
    }

    let newParentId: string | undefined = existingFolder.parentFolderId;

    if (input.newParentFolderId !== undefined) {
      newParentId =
        input.newParentFolderId === "" ? undefined : input.newParentFolderId;
    }

    const isNameChanged = newName !== existingFolder.name;
    const isLocationChanged = newParentId !== existingFolder.parentFolderId;

    // check trùng tên
    if (isNameChanged || isLocationChanged) {
      const siblings = await this.folderRepository.findByParentFolderId(
        newParentId,
        existingFolder.userId
      );

      const isDuplicate = siblings.some(
        (f) => f.name === newName && f.id !== existingFolder.id
      );

      if (isDuplicate) {
        throw new Error(
          `Folder with name "${newName}" already exists in the destination folder.`
        );
      }
    }

    const uow = await this.createNoteUnitOfWork();

    // if change location
    if (isLocationChanged) {
      try {
        await uow.begin();
        await uow.folders.cutFolder(
          existingFolder.id,
          existingFolder.userId,
          newParentId
        );
      } catch (error) {
        await uow.rollback();
        throw error;
      }
    }

    if (isNameChanged) {
      const folderToSave = new Folder(
        newName,
        existingFolder.userId,
        existingFolder.parentFolderId,
        existingFolder.id,
        existingFolder.createdAt,
        new Date()
      );

      await this.folderRepository.save(folderToSave);
    }

    const updatedFolder = new Folder(
      newName,
      existingFolder.userId,
      newParentId,
      existingFolder.id,
      existingFolder.createdAt,
      new Date()
    );

    console.log(
      `Updated folder: id: ${updatedFolder.id}, name: ${updatedFolder.name}, parentFolderId: ${updatedFolder.parentFolderId}, userId: ${updatedFolder.userId}`
    );

    return { folder: updatedFolder };
  }
}
