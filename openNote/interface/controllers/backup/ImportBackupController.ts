import { IUnitOfWork } from "../../../application/IUnitOfWork.ts";
import { ImportBackup } from "../../../application/useCases/backup/ImportBackUp.ts";

export interface ImportBackupRequest {
  readonly userId: string;
  readonly fileContent: string; // nội dung file JSON upload lên
}

export class ImportBackupController {
  private useCase: ImportBackup;

  // import cần transaction --> truyền Factory tạo UoW
  constructor(createUnitOfWork: () => Promise<IUnitOfWork>) {
    this.useCase = new ImportBackup(createUnitOfWork);
  }

  async apply(request: ImportBackupRequest): Promise<void> {
    try {
      // validate input
      if (!request.fileContent) {
        throw new Error("Backup content is empty");
      }

      await this.useCase.execute(request.userId, request.fileContent);
    } catch (error) {
      throw error;
    }
  }
}
