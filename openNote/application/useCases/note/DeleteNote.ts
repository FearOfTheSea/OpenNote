import { NoteRepository } from "../../repositories/NoteRepository.ts";
import { IUnitOfWork } from "../../IUnitOfWork.ts";

export interface DeleteNoteInput {
  readonly id: string;
}

export class DeleteNote {
  constructor(
    private noteRepository: NoteRepository,
    private readonly createNoteUnitOfWork: () => Promise<IUnitOfWork>
  ) {}

  async execute(input: DeleteNoteInput): Promise<void> {
    const existingNote = await this.noteRepository.findById(input.id);

    if (!existingNote) {
      throw new Error(`Note with id ${input.id} not found`);
    }

    const uow = await this.createNoteUnitOfWork();
    try {
      await uow.begin();
      await uow.notes.delete(input.id);
      await uow.tags.cleanupOrphanTags();
      await uow.commit();
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }
}
