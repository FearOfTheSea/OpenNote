import { Tag } from '../../../domain/entities/Tag';
import { TagRepository } from '../../repositories/TagRepository';

export interface UpdateTagInput {
    id: string;
    name: string;
}

export interface UpdateTagOutput {
    success: boolean;
    tag?: Tag;
}

export class UpdateTag {
    constructor(private tagRepository: TagRepository) {}

    async execute(input: UpdateTagInput): Promise<UpdateTagOutput> {
        const existingTag = await this.tagRepository.findById(input.id);
        if (!existingTag) {
            return { success: false };
        }

        const updatedTag: Tag = {
            id: input.id,
            name: input.name
        };

        await this.tagRepository.save(updatedTag);

        return {
            success: true,
            tag: updatedTag
        };
    }
}