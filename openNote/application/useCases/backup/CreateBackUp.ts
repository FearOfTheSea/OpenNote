import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";
import { BackupDataDTO, BackupTag } from "../../dtos/BackupDataDTO.ts";

export class CreateBackup {
  constructor(
    private folderRepo: FolderRepository,
    private noteRepo: NoteRepository,
    private tagRepo: TagRepository
  ) {}

  async execute(userId: string): Promise<string> {
    // 1. Lấy dữ liệu song song để tối ưu hiệu năng
    const [folders, notes, tags] = await Promise.all([
      this.folderRepo.findAll(userId),
      this.noteRepo.findAll(userId),
      this.tagRepo.findAll(userId),
    ]);

    // 2. Map Tag entity sang BackupTag format
    const backupTags: BackupTag[] = tags.map((t) => ({
      id: t.id,
      name: t.name,
    }));

    // 3. Đóng gói dữ liệu
    const backupData: BackupDataDTO = {
      version: 1,
      timestamp: new Date().toISOString(),
      userId: userId,
      data: {
        folders: folders,
        notes: notes,
        tags: backupTags,
      },
    };

    // 4. Trả về chuỗi JSON
    return JSON.stringify(backupData, null, 2);
  }
}
