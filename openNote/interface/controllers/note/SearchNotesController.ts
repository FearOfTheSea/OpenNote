import { NoteRepository } from "../../repositories/NoteRepository.ts";
import {
  SearchNotes,
  SearchNotesInput,
  SearchNotesOutput,
} from "../../../application/useCases/note/SearchNotes.ts";
import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";

export interface SearchNotesRequest {
  readonly query?: string;
  readonly folderId?: string;
  readonly tagsId?: string[];
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
    const input: SearchNotesInput = {
      query: request.query,
      tagsId: request.tagsId,
      folderId: request.folderId,
    };
    const output: SearchNotesOutput = await this.useCase.execute(input);
    return output as SearchNotesResponse;
  }
}
