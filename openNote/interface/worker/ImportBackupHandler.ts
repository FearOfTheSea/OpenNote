import { ImportBackup } from "../../application/useCases/backup/ImportBackUp.ts";
import { BackupDataDTO } from "../../application/dtos/BackupDataDTO.ts";

export class ImportBackupHandler {
  constructor(private importBackupUseCase: ImportBackup) {}

  async execute(userId: string, importData: BackupDataDTO): Promise<void> {
    try {
      if (!importData || !importData.data) {
        throw new Error("Invalid backup file format: missing 'data' field");
      }

      // 3. Gọi use case xử lý logic
      await this.importBackupUseCase.execute(userId, importData);
    } catch (error) {
      console.error(
        `[WorkerHandler] Error processing import job for user ${userId}:`,
        error,
      );
      throw error; // Throw tiếp để Worker biết là Job Failed (để Retry)
    }
  }
}
