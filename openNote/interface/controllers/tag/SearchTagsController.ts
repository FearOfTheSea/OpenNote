import { GetTagByIdResponse } from "./GetTagByIdController.ts";
import {
  SearchTags,
  SearchTagsInput,
} from "../../../application/useCases/tag/SearchTags.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";

export interface SearchTagsRequest {
  readonly query: string;
}

export interface SearchTagsResponse {
  readonly tags: GetTagByIdResponse[];
}

export class SearchTagsController {
  private useCase: SearchTags;

  constructor(tagRepository: TagRepository) {
    this.useCase = new SearchTags(tagRepository);
  }

  async apply(request: SearchTagsRequest): Promise<SearchNotesResponse> {
    const input = request as SearchTagsInput;
    return await this.useCase.execute(input) as SearchTagsResponse;
  }
}
