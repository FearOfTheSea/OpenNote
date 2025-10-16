import { Tag } from "../../../domain/entities/Tag.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface CreateTagInput {
    name: string;
}

export interface CreateTagOutput {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

export class CreateTag {
    constructor(private tagRepository: TagRepository) {}

    async execute(input: CreateTagInput): Promise<CreateTagOutput> {
        try {
            const tag = new Tag(input.name);
            await this.tagRepository.save(tag);
            return { id: tag.id, createdAt: tag.createdAt, updatedAt: tag.updatedAt };
        } catch (error) {
            throw error;
        }
    }
}
