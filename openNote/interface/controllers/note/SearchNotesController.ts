import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import { SearchNotes, SearchNotesInput, SearchNotesOutput } from "../../../application/useCases/note/SearchNotes.ts";
import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";

export interface SearchNotesRequest {
  readonly keyword: string;
  readonly userId: string;
}

export interface SearchNotesResponse {
  readonly notes: GetNoteByIdResponse[];
}

export class SearchNotesController {
  private useCase: SearchNotes;

  constructor(noteRepository: NoteRepository) {
    this.useCase = new SearchNotes(noteRepository);
  }

  async apply(request: SearchNotesRequest): Promise<SearchNotesResponse> {
    const input = request as SearchNotesInput;
    const output: SearchNotesOutput = await this.useCase.execute(input);
    return output as SearchNotesResponse;
  }
}
