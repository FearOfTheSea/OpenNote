import { Attachment } from "../../domain/entities/Attachment.ts";
import { AttachmentRepository } from "../repositories/AttachmentRepository.ts";
import { IStorageService, UploadedInputFile } from "./IStorageService.ts";

/*
this class handles attachment-related operations
including uploading, listing, deleting, and copying attachments
It interacts with both the AttachmentRepository for database operations and the IStorageService for file storage operations.
*/
export class AttachmentService {
    constructor(
        private readonly attachmentRepository: AttachmentRepository,
        private readonly storageService: IStorageService,
    ) {}

    public async uploadAttachment(
        noteId: string,
        file: UploadedInputFile,
    ): Promise<Attachment> {
        // upload file to local storage/cloudflare R2
        const uploadedFile = await this.storageService.upload(file);

        // create new instance
        const newAttachment = new Attachment({
            noteId: noteId,
            path: uploadedFile.path,
            fileName: uploadedFile.fileName,
            size: uploadedFile.size,
        });

        // save attachment into postgreSQL database
        await this.attachmentRepository.save(newAttachment);

        return newAttachment;
    }

    public listAttachments(noteId: string): Promise<Attachment[]> {
        return this.attachmentRepository.findByNoteId(noteId);
    }

    public async deleteAttachment(file_path: string, id: string): Promise<void> {
        // delete from storage service
        await this.storageService.delete(file_path);

        // delete from postgreSQL database
        await this.attachmentRepository.delete(id);
    }

    async deleteAllAttachments(noteId: string): Promise<void> {
        const attachments = await this.listAttachments(noteId);
        for (const file of attachments) {
            await this.deleteAttachment(file.path, file.id);
        }
    }

    async copyAttachment(attachment: Attachment): Promise<Attachment> {
        let uploadedFile;

        if (this.storageService.copy) {
            // Nếu storage service có hàm copy (ví dụ Cloudflare R2)
            uploadedFile = await this.storageService.copy(
                attachment.path,
                `copy-${Date.now()}-${attachment.fileName}`,
            );
        } else if (this.storageService.download) {
            // Nếu là local storage (phải đọc và ghi lại)
            const buffer = await this.storageService.download(attachment.path);
            const uploadedInput: UploadedInputFile = {
                fieldname: "file",
                originalname: attachment.fileName,
                encoding: "7bit",
                mimetype: "application/octet-stream",
                size: attachment.size ?? 0,
                destination: "uploads/",
                filename: `copy-${Date.now()}-${attachment.fileName}`,
                path: `uploads/copy-${Date.now()}-${attachment.fileName}`,
                buffer,
            };
            uploadedFile = await this.storageService.upload(uploadedInput);
        } else {
            throw new Error("Storage service does not support copy or download.");
        }

        const newAttachment = new Attachment({
            noteId: attachment.noteId, // có thể thay đổi khi copy note
            path: uploadedFile.path,
            fileName: uploadedFile.fileName,
            size: uploadedFile.size,
        });

        await this.attachmentRepository.save(newAttachment);
        return newAttachment;
    }
}
