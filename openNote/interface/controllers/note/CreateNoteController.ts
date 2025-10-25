import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import { CreateNote, CreateNoteInput } from "../../../application/useCases/note/CreateNote.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";
import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";

export interface CreateNoteRequest {
    readonly name: string;
    readonly content: string;
    readonly parentFolderId: string;
    readonly tagsIds?: string[];
}

export interface CreateNoteResponse {
    readonly note: GetNoteByIdResponse;
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
            return output as CreateNoteResponse;
        } catch (error) {
            throw error;
        }
    }
}
