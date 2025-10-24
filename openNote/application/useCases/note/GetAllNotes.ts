import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface GetAllNotesInput {
  readonly userId: string;
}
export interface GetAllNotesOutput {
  readonly notes: Note[];
}

export class GetAllNotes {
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(input: GetAllNotesInput): Promise<GetAllNotesOutput> {
    return { notes: await this.noteRepository.findAll(input.userId) };
  }
}
