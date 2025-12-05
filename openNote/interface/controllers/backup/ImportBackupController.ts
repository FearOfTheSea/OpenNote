// import { IUnitOfWork } from "../../../application/IUnitOfWork.ts";
// import { ImportBackup } from "../../../application/useCases/backup/ImportBackUp.ts";

// export interface ImportBackupRequest {
//   readonly userId: string;
//   readonly fileContent: string; // nội dung file JSON upload lên
// }

// export class ImportBackupController {
//   private useCase: ImportBackup;

//   // import cần transaction --> truyền Factory tạo UoW
//   constructor(createUnitOfWork: () => Promise<IUnitOfWork>) {
//     this.useCase = new ImportBackup(createUnitOfWork);
//   }

//   async apply(request: ImportBackupRequest): Promise<void> {
//     try {
//       // validate input
//       if (!request.fileContent) {
//         throw new Error("Backup content is empty");
//       }

//       await this.useCase.execute(request.userId, request.fileContent);
//     } catch (error) {
//       throw error;
//     }
//   }
// }

// controller với queue và job tracking
import { IQueueService } from "../../../application/ports/IQueueService.ts";
import { JobRepository } from "../../../application/repositories/JobRepository.ts";

export interface ImportBackupRequest {
  readonly userId: string;
  readonly fileContent: string;
}

export class ImportBackupController {
  constructor(
    private jobRepo: JobRepository,
    private queueService: IQueueService,
  ) {}

  async apply(request: ImportBackupRequest): Promise<any> {
    try {
      if (!request.fileContent) {
        throw new Error("Backup content is empty");
      }

      // 1. Tạo Job Record (PENDING)
      const jobId = await this.jobRepo.create(request.userId, "IMPORT_DATA");

      // 2. Đẩy vào Queue
      const payload = {
        jobId: jobId,
        userId: request.userId,
        jsonContent: request.fileContent,
      };

      await this.queueService.enqueue("import_queue", payload);

      // 3. Trả về ngay lập tức
      return {
        success: true,
        message: "Import process started in background.",
        jobId: jobId,
      };
    } catch (error) {
      throw error;
    }
  }
}
