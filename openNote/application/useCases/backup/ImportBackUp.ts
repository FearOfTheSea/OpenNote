// application/useCases/backup/ImportBackup.ts
import { IUnitOfWork } from "../../ports/IUnitOfWork.ts";
import { BackupDataDTO } from "../../dtos/BackupDataDTO.ts";
import { Tag } from "../../../domain/entities/Tag.ts";

// Factory function type để tạo UoW mới cho mỗi lần import
export type UnitOfWorkFactory = () => Promise<IUnitOfWork>;

export class ImportBackup {
  constructor(private makeUow: UnitOfWorkFactory) {}

  async execute(userId: string, dataDto: BackupDataDTO): Promise<void> {
    console.log("[ImportBackup] START executing..."); // Log 1

    const data = dataDto.data;

    // DEBUG 2: Kiểm tra số lượng phần tử thực tế nhận được
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

      // --- IMPORT FOLDERS (Pass 1 - Tạo cấu trúc phẳng) ---
      // Tạo folder với parent_id = null trước để tránh lỗi FK nếu cha chưa tạo
      for (const oldFolder of data.folders) {
        const newId = crypto.randomUUID();
        folderMap.set(oldFolder.id, newId);

        // DEBUG 3: Xác nhận đang insert folder
        console.log(
          `Processing Folder: ${oldFolder.name} (OldID: ${oldFolder.id} -> NewID: ${newId})`,
        );

        await folderRepo.save({
          ...oldFolder,
          id: newId,
          userId: userId, // Override user sở hữu
          parentFolderId: undefined,
        });
      }

      // --- IMPORT FOLDERS (Pass 2 - Cập nhật cha con) ---
      for (const oldFolder of data.folders) {
        if (oldFolder.parentFolderId) {
          const newId = folderMap.get(oldFolder.id);
          const newParentId = folderMap.get(oldFolder.parentFolderId);

          if (newId && newParentId) {
            // Gọi save lại để update parentId
            await folderRepo.save({
              ...oldFolder,
              id: newId,
              userId: userId,
              parentFolderId: newParentId,
            });
          }
        }
      }

      console.log("[ImportBackup] Folders processed."); // Log 4

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

        // Lưu Note (Constraint: Note phải thuộc Folder)
        await noteRepo.save({
          ...oldNote,
          id: newNoteId,
          parentFolderId: newFolderId, // Link vào folder mới
        });

        // Xử lý Tags
        // Note entity có thuộc tính `tags` (là mảng tag_id từ file backup)
        // tìm tên của tag đó trong danh sách `data.tags` để tạo lại
        if (oldNote.tagIds && oldNote.tagIds.length > 0) {
          for (const oldTagId of oldNote.tagIds) {
            // Tìm thông tin tag trong file backup để lấy Tên
            const tagInfo = data.tags.find((t) => t.id === oldTagId);

            if (tagInfo) {
              // Tạo entity Tag mới
              // Logic repo save(tag, noteId) sẽ tự động:
              // 1. Tạo tag global nếu chưa có (dựa trên tên)
              // 2. Link tag vào note_tags
              const tagEntity = new Tag(tagInfo.name);
              await tagRepo.save(tagEntity, newNoteId);
            }
          }
        }
      }

      console.log("[ImportBackup] Notes processed. Committing...");

      await uow.commit();
      console.log("[ImportBackup] COMMIT SUCCESS!"); // Log 6
    } catch (error) {
      console.error("Import Error:", error);
      await uow.rollback();
      throw error;
    }
  }
}
