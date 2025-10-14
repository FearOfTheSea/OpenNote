import { Tag } from "../../../domain/entities/Tag.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface SearchTagsInput {
    query: string;
}

export interface SearchTagsOutput {
    tags: Tag[];
}

export class SearchTags {
    constructor(private tagRepository: TagRepository) {}

    async execute(input: SearchTagsInput): Promise<SearchTagsOutput> {
        const allTags = await this.tagRepository.findAll();
        if (!input.query) {
            return allTags;
        }
        const foundTags = allTags.filter((tag) => tag.name.toLowerCase().includes(input.query.toLowerCase()));

        return { tags: foundTags };
    }
}
