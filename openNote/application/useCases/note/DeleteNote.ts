import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface DeleteNoteInput {
    readonly id: string;
}

export class DeleteNote {
    constructor(private noteRepository: NoteRepository) {}

    async execute(input: DeleteNoteInput): Promise<void> {
        const existingNote = await this.noteRepository.findById(input.id);

        if (!existingNote) {
            throw new Error(`Note with id ${input.id} not found`);
        }

        await this.noteRepository.delete(input.id);
    }
}
