import { DeleteAttachment, DeleteAttachmentInput } from "../../../application/useCases/attachment/DeleteAttachment.ts";
import { AttachmentRepository } from "../../../application/repositories/AttachmentRepository.ts";
import { IStorageService } from "../../../application/services/IStorageService.ts";

export type DeleteAttachmentRequest = DeleteAttachmentInput;

export class DeleteAttachmentController {
    private useCase: DeleteAttachment;

    constructor(
        attachmentRepository: AttachmentRepository,
        storageService: IStorageService,
    ) {
        this.useCase = new DeleteAttachment(attachmentRepository, storageService);
    }

    async apply(request: DeleteAttachmentRequest): Promise<void> {
        await this.useCase.execute(request);
    }
}
