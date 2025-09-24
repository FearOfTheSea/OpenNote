// app/use-cases/note/CreateNote.ts
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
        // The validation happens automatically in the Note constructor
        const note = new Note(
            this.generateId(),
            input.name,
            input.content,
            input.folderId,
            input.tagsId || []
        );

        await this.noteRepository.save(note);

        return { id: note.id };
    }

    private generateId(): string {
        return crypto.randomUUID();
    }
}