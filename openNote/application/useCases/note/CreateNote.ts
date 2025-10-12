import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface CreateNoteInput {
  name: string;
  content: string;
  folderId?: string;
  tagsId?: string[];
}

export interface CreateNoteOutput {
  id: string;
}

export class CreateNote {
  constructor(private noteRepository: NoteRepository) {}

  async execute(input: CreateNoteInput): Promise<CreateNoteOutput> {
    const note = new Note(
      input.name,
      input.content,
      input.folderId,
      input.tagsId,
    );

    await this.noteRepository.save(note);

    return { id: note.id };
  }
}
