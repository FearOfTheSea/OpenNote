import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface GetNoteByIdInput {
    readonly id: string;
}

export interface GetNoteByIdOutput {
    readonly note: Note;
}

export class GetNoteById {
    constructor(private noteRepository: NoteRepository) {
    }

    async execute(input: GetNoteByIdInput): Promise<GetNoteByIdOutput> {
        const note = await this.noteRepository.findById(input.id);

        if (!note) {
            throw new Error(`Note with id ${input.id} not found`);
        }

        return { note: note };
    }
}
