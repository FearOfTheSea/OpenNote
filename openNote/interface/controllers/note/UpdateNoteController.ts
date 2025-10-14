import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import { UpdateNote, UpdateNoteInput } from "../../../application/useCases/note/UpdateNote.ts";
import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";

export interface UpdateNoteRequest {
    readonly id: string;
    readonly name?: string;
    readonly content?: string;
    readonly folderId?: string;
    readonly tagsId?: string[];
}

export interface UpdateNoteResponse {
    readonly note: GetNoteByIdResponse;
}

export class UpdateNoteController {
    private useCase: UpdateNote;

    constructor(noteRepository: NoteRepository, folderRepository: FolderRepository, tagRepository: TagRepository) {
        this.useCase = new UpdateNote(noteRepository, folderRepository, tagRepository);
    }

    async apply(request: UpdateNoteRequest): Promise<UpdateNoteResponse> {
        const input: UpdateNoteInput = request as UpdateNoteInput;
        try {
            return await this.useCase.execute(input) as UpdateNoteResponse;
        } catch (error) {
            throw error;
        }
    }
}
