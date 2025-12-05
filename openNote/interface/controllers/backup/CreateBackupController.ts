// import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
// import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
// import { TagRepository } from "../../../application/repositories/TagRepository.ts";
// import { CreateBackup } from "../../../application/useCases/backup/CreateBackUp.ts";

// // request chỉ cần userId (lấy từ session)
// export interface CreateBackupRequest {
//   readonly userId: string;
// }

// // Response trả về chuỗi JSON
// export interface CreateBackupResponse {
//   readonly jsonContent: string;
//   readonly filename: string;
// }

// export class CreateBackupController {
//   private useCase: CreateBackup;

//   constructor(
//     folderRepository: FolderRepository,
//     noteRepository: NoteRepository,
//     tagRepository: TagRepository
//   ) {
//     // Controller chịu trách nhiệm lắp ráp UseCase với các Repo
//     this.useCase = new CreateBackup(
//       folderRepository,
//       noteRepository,
//       tagRepository
//     );
//   }

//   async apply(request: CreateBackupRequest): Promise<CreateBackupResponse> {
//     try {
//       const jsonContent = await this.useCase.execute(request.userId);

//       return {
//         jsonContent,
//         filename: `backup_${new Date().toISOString()}.json`,
//       };
//     } catch (error) {
//       throw error;
//     }
//   }
// }

// controller với queue và job tracking
import { JobRepository } from "../../../application/repositories/JobRepository.ts";
import { IQueueService } from "../../../application/ports/IQueueService.ts";

export interface CreateBackupRequest {
  readonly userId: string;
}

export interface CreateBackupResponse {
  readonly success: boolean;
  readonly message: string;
  readonly jobId: string;
}

export class CreateBackupController {
  constructor(
    private jobRepo: JobRepository,
    private queueService: IQueueService
  ) {}

  async apply(request: { userId: string }): Promise<any> {
    try {
      const jobId = await this.jobRepo.create(request.userId, "EXPORT_DATA");

      const payload = {
        jobId,
        userId: request.userId,
        type: "EXPORT_DATA",
      };

      await this.queueService.enqueue("export_queue", payload);

      return {
        success: true,
        message: "Backup creation started. Please poll status.",
        jobId,
      };
    } catch (error) {
      throw error;
    }
  }
}
