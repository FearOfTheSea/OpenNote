import {
    UploadAttachment,
    UploadAttachmentInput,
    UploadAttachmentOutput,
} from "../../../application/useCases/attachment/UploadAttachment.ts";
import { AttachmentRepository } from "../../../application/repositories/AttachmentRepository.ts";
import { IStorageService, UploadedInputFile } from "../../../application/services/IStorageService.ts";

export interface UploadAttachmentRequest {
    readonly noteId: string;
    readonly file: UploadedInputFile;
}

export type UploadAttachmentResponse = UploadAttachmentOutput;

export class UploadAttachmentController {
    private useCase: UploadAttachment;

    constructor(
        attachmentRepository: AttachmentRepository,
        storageService: IStorageService,
    ) {
        this.useCase = new UploadAttachment(attachmentRepository, storageService);
    }

    async apply(
        request: UploadAttachmentRequest,
    ): Promise<UploadAttachmentResponse> {
        const input: UploadAttachmentInput = request;
        return await this.useCase.execute(input);
    }
}
