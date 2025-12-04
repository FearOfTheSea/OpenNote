import { ImportBackup } from "../../application/useCases/backup/ImportBackUp.ts";
import { BackupDataDTO } from "../../application/dtos/BackupDataDTO.ts";

export class ImportBackupHandler {
  constructor(private importBackupUseCase: ImportBackup) {}

  async execute(userId: string, jsonString: string): Promise<void> {
    try {
      // 1. Parse JSON từ chuỗi
      const parsedData: BackupDataDTO = JSON.parse(jsonString);

      // 2. Validate
      if (!parsedData || !parsedData.data) {
        throw new Error("Invalid backup file format: missing 'data' field");
      }

      // 3. Gọi use case xử lý logic
      await this.importBackupUseCase.execute(userId, parsedData);
    } catch (error) {
      console.error(
        `[WorkerHandler] Error processing import job for user ${userId}:`,
        error
      );
      throw error; // Throw tiếp để Worker biết là Job Failed (để Retry)
    }
  }
}
