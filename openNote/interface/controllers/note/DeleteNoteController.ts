import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import { DeleteNote } from "../../../application/useCases/note/DeleteNote.ts";

export interface DeleteNoteRequest {
  readonly id: string;
}

export class DeleteNoteController {
  private useCase: DeleteNote;

  constructor(noteRepository: NoteRepository) {
    this.useCase = new DeleteNote(noteRepository);
  }

  async apply(request: DeleteNoteRequest): Promise<void> {
    const input = { id: request.id };
    return await this.useCase.execute(input);
  }
}
