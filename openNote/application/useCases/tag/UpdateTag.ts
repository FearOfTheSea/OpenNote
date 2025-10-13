import { Tag } from "../../../domain/entities/Tag.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface UpdateTagInput {
  id: string;
  name: string;
}

export interface UpdateTagOutput {
  tag: Tag;
}

export class UpdateTag {
  constructor(private tagRepository: TagRepository) {}

  async execute(input: UpdateTagInput): Promise<UpdateTagOutput> {
    const existingTag = await this.tagRepository.findById(input.id);
    if (!existingTag) {
      throw new Error(`Tag with id ${input.id} not found`);
    }

    const updatedTag: Tag = {
      id: input.id,
      name: input.name,
    };

    await this.tagRepository.save(updatedTag);

    return { tag: updatedTag };
  }
}
