import { TagRepository } from '../../repositories/TagRepository';

export interface DeleteTagInput {
    id: string;
}

export interface DeleteTagOutput {
    success: boolean;
}

export class DeleteTag {
    constructor(private tagRepository: TagRepository) {}

    async execute(input: DeleteTagInput): Promise<DeleteTagOutput> {
        // Optional: Check if tag exists before deletion
        const existingTag = await this.tagRepository.findById(input.id);
        if (!existingTag) {
            return { success: false };
        }

        await this.tagRepository.delete(input.id);

        return { success: true };
    }
}