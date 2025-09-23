import { Note } from '../../../domain/entities/Note';
import { NoteRepository } from '../../../domain/repositories/NoteRepository';

export interface GetNoteInput {
    id: string;
}

export interface GetNoteOutput {
    note: Note;
}

export class GetNote {
    constructor(private noteRepository: NoteRepository) {}

    async execute(input: GetNoteInput): Promise<GetNoteOutput> {
        const note = await this.noteRepository.findById(input.id);

        if (!note) {
            throw new Error(`Note with id ${input.id} not found`);
        }

        return { note };
    }
}