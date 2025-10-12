import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface SearchNotesInput {
  query?: string;
  folderId?: string;
  tagsId?: string[];
}

export interface SearchNotesOutput {
  notes: Note[];
}

export class SearchNotes {
  constructor(private noteRepository: NoteRepository) {}

  async execute(input: SearchNotesInput): Promise<SearchNotesOutput> {
    const allNotes = await this.noteRepository.findAll();

    const filteredNotes = allNotes.filter((note) => {
      if (input.query) {
        const searchTerm = input.query.toLowerCase();
        const matchesText = note.name.toLowerCase().includes(searchTerm) ||
          note.content.toLowerCase().includes(searchTerm);
        if (!matchesText) return false;
      }

      if (input.folderId !== undefined) {
        if (note.folderId !== input.folderId) return false;
      }

      if (input.tagsId && input.tagsId.length > 0) {
        const hasAllTags = input.tagsId.every((tagId) =>
          note.tagsId.includes(tagId)
        );
        if (!hasAllTags) return false;
      }

      return true;
    });

    return { notes: filteredNotes };
  }
}
