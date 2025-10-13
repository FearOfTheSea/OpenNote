import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface GetNotesByTagInput {
  readonly tagsId: string[];
}

export interface GetNotesByTagOutput {
  readonly notes: Note[];
}

export class GetNotesByTags {
  constructor(private noteRepository: NoteRepository) {}

  async execute(input: GetNotesByTagInput): Promise<GetNotesByTagOutput> {
    const allNotes = await this.noteRepository.findAll();

    const filteredNotes = allNotes.filter((note) => {
      for (const tagId in input.tagsId) {
        if (!note.tagsId.includes(tagId)) {
          return false;
        }
      }
      return true;
    });

    return { notes: filteredNotes };
  }
}
