import { IStorageService, UploadedFile, UploadedInputFile } from "../../application/services/IStorageService.ts";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * This class provides a local file storage implementation of the IStorageService interface.
 * It allows uploading and deleting files from a local directory.
 * This will be replaced by a cloud-based service (maybe cloudflare R2).
 */
export class LocalStorageService implements IStorageService {
    private readonly uploadDir = path.join(__dirname, "../../../uploads"); // dirwhere uploaded files are stored locally
    private readonly baseUrl = "http://localhost:3000/uploads"; // URL to access attachment

    constructor() {
        // dam bao dir upload ton tai
        fs.mkdir(this.uploadDir, { recursive: true });
    }

    async upload(file: UploadedInputFile): Promise<UploadedFile> {
        if (!file.buffer) {
            throw new Error("File content (buffer) is missing.");
        }

        const fileExtension = path.extname(file.originalname);
        const uniqueFileName = `${randomUUID()}${fileExtension}`;
        const filePath = path.join(this.uploadDir, uniqueFileName);

        // dùng API của Deno để ghi file
        await Deno.writeFile(filePath, file.buffer);

        return {
            path: `${this.baseUrl}/${uniqueFileName}`,
            fileName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
        };
    }

    // delete file by its URL path in postgreSQL
    async delete(urlPath: string): Promise<void> {
        try {
            // lấy tên file từ URL
            if (!urlPath.startsWith(this.baseUrl)) {
                console.warn(`Path "${urlPath}" is not managed by this service.`);
                return;
            }
            const fileName = urlPath.substring(this.baseUrl.length + 1);

            // tạo đường dẫn file cục bộ đầy đủ
            const localFilePath = path.join(this.uploadDir, fileName);

            // dùng API của Deno để xóa file
            await Deno.remove(localFilePath);

            console.log(`Successfully deleted file: ${localFilePath}`);
        } catch (error) {
            if (error instanceof Deno.errors.NotFound) {
                console.warn(
                    `File not found, considering it as already deleted: ${urlPath}`,
                );
                return;
            }
            console.error(`Error deleting file for path ${urlPath}:`, error);
            throw new Error(`Could not delete file.`);
        }
    }

    //urlPath là đường dẫn storage service lưu trữ file
    async download(urlPath: string): Promise<Uint8Array> {
        // lấy tên file từ URL
        if (!urlPath.startsWith(this.baseUrl)) {
            throw new Error(`Path "${path}" is not managed by this service.`);
        }
        const fileName = urlPath.substring(this.baseUrl.length + 1);

        // tạo đường dẫn file cục bộ đầy đủ
        const localFilePath = path.join(this.uploadDir, fileName);
        // dùng API của Deno để đọc file
        const fileBuffer = await Deno.readFile(localFilePath);
        return fileBuffer;
    }
}
