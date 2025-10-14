import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface SearchNotesInput {
    readonly query?: string;
}

export interface SearchNotesOutput {
    readonly notes: Note[];
}

export class SearchNotes {
    constructor(private noteRepository: NoteRepository) {}

    async execute(input: SearchNotesInput): Promise<SearchNotesOutput> {
        const allNotes = await this.noteRepository.findAll();

        if (!input.query) {
            return allNotes;
        }

        const filteredNotes = allNotes.filter((note) => {
            const searchTerm = input.query.toLowerCase();
            return note.name.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm);
        });

        return { notes: filteredNotes };
    }
}
