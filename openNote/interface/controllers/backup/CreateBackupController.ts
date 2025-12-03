import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";
import { CreateBackup } from "../../../application/useCases/backup/CreateBackUp.ts";

// request chỉ cần userId (lấy từ session)
export interface CreateBackupRequest {
  readonly userId: string;
}

// Response trả về chuỗi JSON
export interface CreateBackupResponse {
  readonly jsonContent: string;
  readonly filename: string;
}

export class CreateBackupController {
  private useCase: CreateBackup;

  constructor(
    folderRepository: FolderRepository,
    noteRepository: NoteRepository,
    tagRepository: TagRepository,
  ) {
    // Controller chịu trách nhiệm lắp ráp UseCase với các Repo
    this.useCase = new CreateBackup(
      folderRepository,
      noteRepository,
      tagRepository,
    );
  }

  async apply(request: CreateBackupRequest): Promise<CreateBackupResponse> {
    try {
      const jsonContent = await this.useCase.execute(request.userId);

      return {
        jsonContent,
        filename: `backup_${new Date().toISOString()}.json`,
      };
    } catch (error) {
      throw error;
    }
  }
}
