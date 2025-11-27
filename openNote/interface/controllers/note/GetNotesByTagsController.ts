import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";
import { GetNotesByTagInput, GetNotesByTags } from "../../../application/useCases/note/GetNotesByTags.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";
import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";

export interface GetNotesByTagsRequest {
  readonly userId: string;
  readonly tagIds: string[];
}

export interface GetNotesByTagsResponse {
  readonly notes: GetNoteByIdResponse[];
}

export class GetNotesByTagsController {
  private useCase: GetNotesByTags;

  constructor(noteRepository: NoteRepository, tagRepository: TagRepository) {
    this.useCase = new GetNotesByTags(noteRepository, tagRepository);
  }

  async apply(request: GetNotesByTagsRequest): Promise<GetNotesByTagsResponse> {
    const input = request as GetNotesByTagInput;

    return await this.useCase.execute(input) as GetNotesByTagsResponse;
  }
}
