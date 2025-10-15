import {
  GetAttachmentsByNote,
  GetAttachmentsByNoteInput,
  GetAttachmentsByNoteOutput,
} from "../../../application/useCases/attachment/GetAttachmentsByNote.ts";
import { AttachmentRepository } from "../../../application/repositories/AttachmentRepository.ts";

export type GetAttachmentsByNoteRequest = GetAttachmentsByNoteInput;
export type GetAttachmentsByNoteResponse = GetAttachmentsByNoteOutput;

export class GetAttachmentsByNoteController {
  private useCase: GetAttachmentsByNote;

  constructor(attachmentRepository: AttachmentRepository) {
    this.useCase = new GetAttachmentsByNote(attachmentRepository);
  }

  async apply(
    request: GetAttachmentsByNoteRequest
  ): Promise<GetAttachmentsByNoteResponse> {
    return await this.useCase.execute(request);
  }
}
