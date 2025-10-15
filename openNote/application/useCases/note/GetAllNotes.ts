import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface GetAllNotesOutput {
    readonly notes: Note[];
}

export class GetAllNotes {
    constructor(private readonly noteRepository: NoteRepository) {}

    async execute(): Promise<GetAllNotesOutput> {
        return { notes: await this.noteRepository.findAll() };
    }
}
