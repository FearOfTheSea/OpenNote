import { AttachmentRepository } from "../../repositories/AttachmentRepository.ts";
import { IStorageService } from "../../services/IStorageService.ts";

export interface DeleteAttachmentInput {
  readonly attachmentId: string;
}

export class DeleteAttachment {
  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly storageService: IStorageService
  ) {}

  async execute(input: DeleteAttachmentInput): Promise<void> {
    // xóa attachment trên storage trước khi xóa trong db
    const attachment = await this.attachmentRepository.findById(
      input.attachmentId
    );
    if (attachment) {
      await this.storageService.delete(attachment.path);
      await this.attachmentRepository.delete(input.attachmentId);
    } else {
      throw new Error("Attachment not found.");
    }
  }
}
