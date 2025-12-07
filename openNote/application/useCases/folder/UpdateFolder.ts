import { Folder } from "../../../domain/entities/Folder.ts";
import { UseCase } from "../../core/UseCase.ts";
// import { FolderRepository } from "../../repositories/FolderRepository.ts"; // ❌ BỎ: Không inject trực tiếp nữa
import { IUnitOfWork } from "../../ports/IUnitOfWork.ts";

export interface UpdateFolderInput {
  readonly id: string;
  readonly newName?: string;
  readonly newParentFolderId?: string;
}

export interface UpdateFolderOutput {
  readonly folder: Folder;
}

export class UpdateFolder implements UseCase<UpdateFolderInput, UpdateFolderOutput> {
  constructor(
    private readonly createNoteUnitOfWork: () => Promise<IUnitOfWork>,
  ) {}

  async execute(input: UpdateFolderInput): Promise<UpdateFolderOutput> {
    const uow = await this.createNoteUnitOfWork();

    try {
      await uow.begin();

      const existingFolder = await uow.folders.findById(input.id);

      if (!existingFolder) {
        throw new Error(`Folder with id ${input.id} not found`);
      }

      if (
        input.newName === undefined &&
        input.newParentFolderId === undefined
      ) {
        await uow.commit(); // Commit rỗng để trả connection về pool
        return { folder: existingFolder };
      }

      let newName = existingFolder.name;
      if (input.newName) {
        newName = input.newName.trim();
      }

      let newParentId: string | undefined = existingFolder.parentFolderId;
      if (input.newParentFolderId !== undefined) {
        newParentId = input.newParentFolderId === "" ? undefined : input.newParentFolderId;
      }

      const isNameChanged = newName !== existingFolder.name;
      const isLocationChanged = newParentId !== existingFolder.parentFolderId;

      if (isNameChanged || isLocationChanged) {
        const siblings = await uow.folders.findByParentFolderId(
          newParentId,
          existingFolder.userId,
        );

        const isDuplicate = siblings.some(
          (f) => f.name === newName && f.id !== existingFolder.id,
        );

        if (isDuplicate) {
          throw new Error(
            `Folder with name "${newName}" already exists in the destination folder.`,
          );
        }
      }

      if (isLocationChanged) {
        console.log("begin cut folder");
        await uow.folders.cutFolder(
          existingFolder.id,
          existingFolder.userId,
          newParentId,
        );
      }

      if (isNameChanged) {
        const folderToSave = new Folder(
          newName,
          existingFolder.userId,
          existingFolder.parentFolderId, // Lưu ý: Nếu location change thì chỗ này phải coi chừng logic cũ
          existingFolder.id,
          existingFolder.createdAt,
          new Date(),
        );
        await uow.folders.save(folderToSave);
      }

      await uow.commit();

      const updatedFolder = new Folder(
        newName,
        existingFolder.userId,
        newParentId,
        existingFolder.id,
        existingFolder.createdAt,
        new Date(),
      );

      console.log(
        `Updated folder: id: ${updatedFolder.id}, userId: ${updatedFolder.userId}`,
      );

      return { folder: updatedFolder };
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }
}
