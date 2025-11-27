import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";
import { GetAllNotes } from "../../../application/useCases/note/GetAllNotes.ts";
import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";

export interface GetAllNotesRequest {
  readonly userId: string;
}

export interface GetAllNotesResponse {
  readonly notes: GetNoteByIdResponse[];
}

export class GetAllNotesController {
  private useCase: GetAllNotes;

  constructor(noteRepository: NoteRepository) {
    this.useCase = new GetAllNotes(noteRepository);
  }

  async apply(request: GetAllNotesRequest): Promise<GetAllNotesResponse> {
    return await this.useCase.execute(request) as GetAllNotesResponse;
  }
}
