import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import { CreateNote, CreateNoteInput } from "../../../application/useCases/note/CreateNote.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";

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

    constructor(noteRepository: NoteRepository, folderRepository: FolderRepository, tagRepository: TagRepository) {
        this.useCase = new CreateNote(noteRepository, folderRepository, tagRepository);
    }

    async apply(request: CreateNoteRequest): Promise<CreateNoteResponse> {
        const input = request as CreateNoteInput;
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
