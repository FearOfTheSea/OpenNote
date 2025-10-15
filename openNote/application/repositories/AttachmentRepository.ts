import { Attachment } from "../../domain/entities/Attachment.ts";

export interface AttachmentRepository {
  findById(id: string): Promise<Attachment | null>;
  findByNoteId(id: string): Promise<Attachment[]>;
  save(attachment: Attachment): Promise<void>;
  delete(id: string): Promise<void>;
}
