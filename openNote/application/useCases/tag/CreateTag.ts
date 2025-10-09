import { Tag } from '../../../domain/entities/Tag.ts';
import { TagRepository } from '../../repositories/TagRepository.ts';

export interface CreateTagInput {
    name: string;
}

export interface CreateTagOutput {
    id: string;
}

export class CreateTag {
    constructor(private tagRepository: TagRepository) {}

    async execute(input: CreateTagInput): Promise<CreateTagOutput> {
        const tag = new Tag(input.name);

        await this.tagRepository.save(tag);

        return { id: tag.id };
    }
}