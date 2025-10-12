import { Note } from "../../../domain/entities/Note";
import { NoteRepository } from "../../repositories/NoteRepository";

export interface CreateNoteInput {
  readonly name: string;
  readonly content: string;
  readonly folderId?: string;
  readonly tagsId?: string[];
}

export interface CreateNoteOutput {
  readonly note: Note;
}

export class CreateNote {
  constructor(private noteRepository: NoteRepository) {}

  async execute(input: CreateNoteInput): Promise<CreateNoteOutput> {
    try {
      const note = new Note(
        input.name,
        input.content,
        input.folderId,
        input.tagsId,
      );
      await this.noteRepository.save(note);
      return { note };
    } catch (error) {
      throw error;
    }
  }
}
