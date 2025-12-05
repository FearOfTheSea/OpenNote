// @ts-types="@std/path"
import { join } from "@std/path";
import { CreateBackup } from "../../application/useCases/backup/CreateBackUp.ts";

export class CreateBackupHandler {
  constructor(private createBackupUseCase: CreateBackup) {}

  /**
   * Thực thi logic export và lưu file
   * Trả về đường dẫn file tương đối (để user download)
   */
  async execute(userId: string, jobId: string): Promise<string> {
    // 1. Gọi Use Case lấy dữ liệu JSON (Nặng về Query DB)
    const jsonString = await this.createBackupUseCase.execute(userId);

    // 2. Định nghĩa đường dẫn lưu file
    // Lưu vào thư mục public để Nginx/Express serve static file
    // Cấu trúc: interface/web/public/backups/
    const fileName = `backup_${jobId}.json`;
    const relativePath = `/backups/${fileName}`;
    const outputDir = join(Deno.cwd(), "interface", "web", "public", "backups");
    const outputPath = join(outputDir, fileName);

    // 3. Đảm bảo thư mục tồn tại
    try {
      await Deno.mkdir(outputDir, { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.AlreadyExists)) throw err;
    }

    // 4. Ghi file ra ổ cứng (Nặng về I/O)
    await Deno.writeTextFile(outputPath, jsonString);

    console.log(`[EXPORT HANDLER] File saved to: ${outputPath}`);

    // 5. Trả về URL để update vào DB
    return relativePath;
  }
}
