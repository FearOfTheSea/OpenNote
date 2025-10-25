import { UpdateNote, UpdateNoteInput } from "../../../application/useCases/note/UpdateNote.ts";
import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";

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

    constructor(useCase: UpdateNote) {
        this.useCase = useCase;
    }

    async apply(request: UpdateNoteRequest): Promise<UpdateNoteResponse> {
        const input: UpdateNoteInput = request as UpdateNoteInput;
        try {
            return (await this.useCase.execute(input)) as UpdateNoteResponse;
        } catch (error) {
            throw error;
        }
    }
}
