import { TagRepository } from "../../repositories/TagRepository.ts";

export interface DeleteTagInput {
    id: string;
}

export class DeleteTag {
    constructor(private tagRepository: TagRepository) {}

    async execute(input: DeleteTagInput): Promise<void> {
        const existingTag = await this.tagRepository.findById(input.id);
        if (!existingTag) {
            throw new Error(`Tag with id ${input.id} not found`);
        }

        await this.tagRepository.delete(input.id);
    }
}
