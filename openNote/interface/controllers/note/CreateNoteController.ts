import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import { CreateNote } from "../../../application/useCases/note/CreateNote.ts";

export interface CreateNoteRequest {
    readonly name: string;
    readonly content: string;
    readonly folderId?: string;
    readonly tagsId?: string[];
}

export interface CreateNoteResponse {
    readonly id: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export class CreateNoteController {
    private useCase: CreateNote;

    constructor(noteRepository: NoteRepository) {
        this.useCase = new CreateNote(noteRepository);
    }

    async apply(request: CreateNoteRequest): Promise<CreateNoteResponse> {
        const input = {
            name: request.name,
            content: request.content,
            folderId: request.folderId,
            tagsId: request.tagsId,
        };

        try {
            const output = await this.useCase.execute(input);
            return {
                id: output.note.id,
                createdAt: output.note.createdAt,
                updatedAt: output.note.updatedAt,
            };
        } catch (error) {
            throw error;
        }
    }
}
