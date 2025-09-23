import { Note } from '../../../domain/entities/Note';
import { NoteRepository } from '../../../domain/repositories/NoteRepository';

export interface CreateNoteInput {
    name: string;
    content: string;
    folderId?: string;
    tagsId?: string[];
}

export interface CreateNoteOutput {
    id: string;
}

export class CreateNote {
    constructor(private noteRepository: NoteRepository) {}

    async execute(input: CreateNoteInput): Promise<CreateNoteOutput> {
        const note: Note = {
            id: this.generateId(),
            name: input.name,
            content: input.content,
            folderId: input.folderId,
            tagsId: input.tagsId || []
        };

        await this.noteRepository.save(note);

        return { id: note.id };
    }

    private generateId(): string {
        return crypto.randomUUID();
    }
}