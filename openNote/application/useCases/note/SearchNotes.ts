import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface SearchNotesInput {
    readonly keyword: string;
    readonly userId: string;
}

export interface SearchNotesOutput {
    readonly notes: Note[];
}

export class SearchNotes {
    constructor(private noteRepository: NoteRepository) {}

    async execute(input: SearchNotesInput): Promise<SearchNotesOutput> {
        const notes = await this.noteRepository.searchByKeyword(input.keyword, input.userId);
        return { notes: notes };
    }
}
