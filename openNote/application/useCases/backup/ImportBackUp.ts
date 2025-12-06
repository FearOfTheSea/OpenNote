import { IUnitOfWork } from "../../ports/IUnitOfWork.ts";
import { BackupDataDTO } from "../../dtos/BackupDataDTO.ts";
import { Tag } from "../../../domain/entities/Tag.ts";

export type UnitOfWorkFactory = () => Promise<IUnitOfWork>;

export class ImportBackup {
  constructor(private makeUow: UnitOfWorkFactory) {}

  async execute(userId: string, dataDto: BackupDataDTO): Promise<void> {
    console.log("[ImportBackup] START executing..."); // Log 1

    const data = dataDto.data;

    console.log(
      `[Debug Data] Folders: ${data.folders?.length}, Notes: ${data.notes?.length}, Tags: ${data.tags?.length}`,
    );

    const uow = await this.makeUow();

    await uow.begin();

    try {
      const folderRepo = uow.folders;
      const noteRepo = uow.notes;
      const tagRepo = uow.tags;

      // Map để ánh xạ id cũ trong file backup -> id mới ở db
      const folderMap = new Map<string, string>();

      // Tạo folder với parent_id = null trước để tránh lỗi FK nếu cha chưa tạo
      for (const oldFolder of data.folders) {
        const newId = crypto.randomUUID();
        folderMap.set(oldFolder.id, newId);

        console.log(
          `Processing Folder: ${oldFolder.name} (OldID: ${oldFolder.id} -> NewID: ${newId})`,
        );

        await folderRepo.restore({
          ...oldFolder,
          id: newId,
          userId: userId, // Override user sở hữu
          parentFolderId: undefined,
        });
      }

      for (const oldFolder of data.folders) {
        if (oldFolder.parentFolderId) {
          const newId = folderMap.get(oldFolder.id);
          const newParentId = folderMap.get(oldFolder.parentFolderId);

          if (newId && newParentId) {
            // Gọi save lại để update parentId
            await folderRepo.restore({
              ...oldFolder,
              id: newId,
              userId: userId,
              parentFolderId: newParentId,
            });
          }
        }
      }

      console.log("[ImportBackup] Folders processed.");

      // --- IMPORT NOTES & TAGS ---
      for (const oldNote of data.notes) {
        // Tìm folder mới tương ứng
        const newFolderId = folderMap.get(oldNote.parentFolderId);

        // Nếu folder gốc không tìm thấy (lỗi file backup), bỏ qua note này
        if (!newFolderId) continue; //skip if parent folder not found

        const newNoteId = crypto.randomUUID();

        console.log(
          `Inserting Note: "${oldNote.name}" into Folder ${newFolderId}`,
        );

        await noteRepo.save({
          ...oldNote,
          id: newNoteId,
          parentFolderId: newFolderId,
        });

        // Xử lý Tags
        if (oldNote.tagIds && oldNote.tagIds.length > 0) {
          for (const oldTagId of oldNote.tagIds) {
            const tagInfo = data.tags.find((t) => t.id === oldTagId);

            if (tagInfo) {
              // Tạo entity Tag mới
              const tagEntity = new Tag(tagInfo.name);
              await tagRepo.save(tagEntity, newNoteId);
            }
          }
        }
      }

      console.log("[ImportBackup] Notes processed. Committing...");

      await uow.commit();
      console.log("[ImportBackup] COMMIT SUCCESS!");
    } catch (error) {
      console.error("Import Error:", error);
      await uow.rollback();
      throw error;
    }
  }
}
