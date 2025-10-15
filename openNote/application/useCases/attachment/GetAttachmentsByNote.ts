import { Attachment } from "../../../domain/entities/Attachment.ts";
import { AttachmentRepository } from "../../repositories/AttachmentRepository.ts";

export interface GetAttachmentsByNoteInput {
    readonly noteId: string;
}

export interface GetAttachmentsByNoteOutput {
    readonly attachments: Attachment[];
}

export class GetAttachmentsByNote {
    constructor(private readonly attachmentRepository: AttachmentRepository) {}

    async execute(input: GetAttachmentsByNoteInput): Promise<GetAttachmentsByNoteOutput> {
        const attachments = await this.attachmentRepository.findByNoteId(
            input.noteId,
        );
        return { attachments };
    }
}
