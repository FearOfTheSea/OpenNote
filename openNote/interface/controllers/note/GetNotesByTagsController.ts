import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";
import {
  GetNotesByTagInput,
  GetNotesByTags,
} from "../../../application/useCases/note/GetNotesByTags.ts";

export interface GetNotesByTagsRequest {
  readonly tagsId: string[];
}

export interface GetNotesByTagsResponse {
  readonly notes: GetNoteByIdResponse[];
}

export class GetNotesByTagsController {
  private useCase: GetNotesByTags;

  constructor(noteRepository: NoteRepository) {
    this.useCase = new GetNotesByTags(noteRepository);
  }

  async apply(request: GetNotesByTagsRequest): Promise<GetNotesByTagsResponse> {
    const input = request as GetNotesByTagInput;
    return await this.useCase.execute(input) as GetNotesByTagsResponse;
  }
}
