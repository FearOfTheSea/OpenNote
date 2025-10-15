import { Attachment } from "../../domain/entities/Attachment.ts";
import { AttachmentRepository } from "../repositories/AttachmentRepository.ts";
import { IStorageService, UploadedInputFile } from "./IStorageService.ts";

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
}
