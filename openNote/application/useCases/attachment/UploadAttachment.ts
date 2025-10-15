import { Attachment } from "../../../domain/entities/Attachment.ts";
import { AttachmentRepository } from "../../../application/repositories/AttachmentRepository.ts";
import { IStorageService, UploadedInputFile } from "../../../application/services/IStorageService.ts";

export interface UploadAttachmentInput {
    readonly noteId: string;
    readonly file: UploadedInputFile;
}

export type UploadAttachmentOutput = Attachment;

export class UploadAttachment {
    constructor(
        private readonly attachmentRepository: AttachmentRepository,
        private readonly storageService: IStorageService,
    ) {}

    async execute(input: UploadAttachmentInput): Promise<UploadAttachmentOutput> {
        const { noteId, file } = input;

        const uploadedFile = await this.storageService.upload(file);

        const newAttachment = new Attachment({
            noteId,
            path: uploadedFile.path,
            fileName: uploadedFile.fileName,
            size: uploadedFile.size,
        });

        await this.attachmentRepository.save(newAttachment);
        return newAttachment;
    }
}
