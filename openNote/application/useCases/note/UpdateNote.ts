import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";

export interface UpdateNoteInput {
    readonly id: string;
    readonly name?: string;
    readonly content?: string;
    readonly folderId?: string;
    readonly tagsId?: string[];
}

export interface UpdateNoteOutput {
    readonly note: Note;
}

export class UpdateNote {
    constructor(private noteRepository: NoteRepository) {}

    async execute(input: UpdateNoteInput): Promise<UpdateNoteOutput> {
        const existingNote = await this.noteRepository.findById(input.id);

        if (!existingNote) {
            throw new Error(`Note with id ${input.id} not found`);
        }

        const updatedNote: Note = {
            ...existingNote,
            ...(input.name !== undefined && { name: input.name }),
            ...(input.content !== undefined && { content: input.content }),
            ...(input.folderId !== undefined && { folderId: input.folderId }),
            ...(input.tagsId !== undefined && { tagsId: input.tagsId }),
        };

        await this.noteRepository.save(updatedNote);
        return { note: updatedNote };
    }
}
