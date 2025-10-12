import { Tag } from "../../../domain/entities/Tag.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface GetTagInput {
  id: string;
}

export interface GetTagOutput {
  tag: Tag | null;
}

export class GetTag {
  constructor(private tagRepository: TagRepository) {}

  async execute(input: GetTagInput): Promise<GetTagOutput> {
    const tag = await this.tagRepository.findById(input.id);

    return { tag };
  }
}
