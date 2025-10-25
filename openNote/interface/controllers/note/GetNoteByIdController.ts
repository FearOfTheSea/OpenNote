import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import { GetNoteById, GetNoteByIdInput, GetNoteByIdOutput } from "../../../application/useCases/note/GetNoteById.ts";

export interface GetNoteByIdRequest {
    readonly id: string;
}

export interface GetNoteByIdResponse {
    readonly id: string;
    readonly name: string;
    readonly content: string;
    readonly parentFolderId: string;
    readonly tagIds: string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export class GetNoteByIdController {
    private useCase: GetNoteById;

    constructor(noteRepository: NoteRepository) {
        this.useCase = new GetNoteById(noteRepository);
    }

    async apply(request: GetNoteByIdRequest): Promise<GetNoteByIdResponse> {
        const input: GetNoteByIdInput = { id: request.id };
        try {
            const output: GetNoteByIdOutput = await this.useCase.execute(input);
            return output.note as GetNoteByIdResponse;
        } catch (error) {
            throw error;
        }
    }
}
