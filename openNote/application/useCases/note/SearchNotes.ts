import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface SearchNotesInput {
    readonly query: string;
    readonly folderId?: string;
}

export interface SearchNotesOutput {
    readonly notes: Note[];
}

export class SearchNotes {
    constructor(private noteRepository: NoteRepository) {}

    async execute(input: SearchNotesInput): Promise<SearchNotesOutput> {
        return { notes: await this.noteRepository.searchByKeyword(input.query, input.folderId) };
    }
}
