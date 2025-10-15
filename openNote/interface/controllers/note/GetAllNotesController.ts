import {GetNoteByIdResponse} from "./GetNoteByIdController.ts";
import {GetAllNotes} from "../../../application/useCases/note/GetAllNotes.ts";
import {NoteRepository} from "../../../application/repositories/NoteRepository.ts";

export interface GetAllNotesResponse {
    readonly notes: GetNoteByIdResponse[];
}

export class GetAllNotesController {
    private useCase: GetAllNotes;

    constructor(noteRepository: NoteRepository) {
        this.useCase = new GetAllNotes(noteRepository);
    }

    async apply(): Promise<GetAllNotesResponse> {
        return await this.useCase.execute() as GetAllNotesResponse;
    }
}
