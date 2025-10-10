import { Note } from '../../../domain/entities/Note.ts';
import { NoteRepository } from '../../repositories/NoteRepository.ts';

export interface UpdateNoteInput {
    id: string;
    name?: string;
    content?: string;
    folderId?: string;
    tagsId?: string[];
}

export class UpdateNote {
    constructor(private noteRepository: NoteRepository) {}

    async execute(input: UpdateNoteInput): Promise<void> {
        const existingNote = await this.noteRepository.findById(input.id);

        if (!existingNote) {
            throw new Error(`Note with id ${input.id} not found`);
        }

        const updatedNote: Note = {
            ...existingNote,
            ...(input.name !== undefined && { name: input.name }),
            ...(input.content !== undefined && { content: input.content }),
            ...(input.folderId !== undefined && { folderId: input.folderId }),
            ...(input.tagsId !== undefined && { tagsId: input.tagsId })
        };

        await this.noteRepository.save(updatedNote);
    }
}