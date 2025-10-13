import {
  CreateTag,
  CreateTagInput,
} from "../../../application/useCases/tag/CreateTag.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";

export interface CreateTagRequest {
  name: string;
}

export interface CreateTagResponse {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateTagController {
  private useCase: CreateTag;

  constructor(private readonly tagRepository: TagRepository) {
    this.useCase = new CreateTag(tagRepository);
  }

  async apply(request: CreateTagRequest): Promise<CreateTagResponse> {
    const input = request as CreateTagInput;
    try {
      return await this.useCase.execute(input) as CreateTagResponse;
    } catch (error) {
    }
  }
}
