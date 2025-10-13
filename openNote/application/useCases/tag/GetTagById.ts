import { Tag } from "../../../domain/entities/Tag.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface GetTagByIdInput {
  readonly id: string;
}

export interface GetTagByIdOutput {
  readonly tag: Tag;
}

export class GetTagById {
  constructor(private tagRepository: TagRepository) {}

  async execute(input: GetTagByIdInput): Promise<GetTagByIdOutput> {
    const tag = await this.tagRepository.findById(input.id);

    if (!tag) {
      throw new Error(`Tag with id ${input.id} not found`);
    }

    return { tag: tag };
  }
}
