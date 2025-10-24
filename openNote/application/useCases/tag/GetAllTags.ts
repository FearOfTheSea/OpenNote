import { Tag } from "../../../domain/entities/Tag.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface GetAllTagsInput {
  readonly userId: string;
}

export interface GetAllTagsOutput {
  readonly tags: Tag[] | null;
}

export class GetAllTags {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(input: GetAllTagsInput): Promise<GetAllTagsOutput> {
    return { tags: await this.tagRepository.findAll(input.userId) };
  }
}
